<?php

namespace App\Console\Commands;

use App\Services\SshKeyService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CreateBaseSnapshotCommand extends Command
{
    protected $signature = 'snapshot:create-base
        {--delete-old : Delete the previous snapshot after creating the new one}
        {--server-type=cpx22 : Hetzner server type for the temporary build server}
        {--location=hel1 : Hetzner datacenter location}';

    protected $description = 'Create a base Hetzner snapshot with OpenClaw pre-installed';

    protected string $apiToken;
    protected string $baseUrl = 'https://api.hetzner.cloud/v1';

    public function handle(): int
    {
        $this->apiToken = config('services.hetzner.token') ?? '';

        if (empty($this->apiToken)) {
            $this->error('HETZNER_API_TOKEN is not set.');
            return self::FAILURE;
        }

        $oldSnapshotId = config('services.hetzner.snapshot_id');
        $serverType = $this->option('server-type');
        $location = $this->option('location');
        $serverId = null;

        try {
            // 1. Create temporary server
            $this->info('Creating temporary build server...');
            $server = $this->createTempServer($serverType, $location);
            $serverId = $server['id'];
            $ip = $server['public_net']['ipv4']['ip'];
            $this->info("Server created: ID={$serverId}, IP={$ip}");

            // 2. Wait for SSH
            $this->info('Waiting for SSH to become available...');
            $this->waitForSsh($ip);
            $this->info('SSH is ready.');

            // 3. Install OpenClaw
            $this->info('Installing OpenClaw (this may take several minutes)...');
            $this->runSsh($ip, 'curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard', 300);
            $this->info('OpenClaw installed.');

            // 4. Install daemon (don't start - no tokens yet)
            $this->info('Pre-installing daemon and configuring defaults...');
            $this->runSsh($ip, '. ~/.profile && . ~/.bashrc && openclaw daemon install');
            $this->runSsh($ip, '. ~/.profile && . ~/.bashrc && openclaw config set gateway.mode local');
            $this->runSsh($ip, 'loginctl enable-linger root');

            // 5. Clean up for snapshot
            $this->info('Cleaning up for snapshot...');
            $this->runSsh($ip, implode(' && ', [
                'openclaw daemon stop 2>/dev/null || true',
                'rm -f /root/.bash_history',
                'rm -rf /var/log/journal/*',
                'rm -f /var/log/cloudclaw_ready',
                'history -c 2>/dev/null || true',
                'sync',
            ]));

            // 6. Shutdown server via API
            $this->info('Shutting down server for snapshot...');
            $this->shutdownServer($serverId);

            // 7. Create snapshot
            $this->info('Creating snapshot (this may take a few minutes)...');
            $snapshotId = $this->createSnapshot($serverId);
            $this->info("Snapshot created: ID={$snapshotId}");

            // 8. Delete temporary server
            $this->info('Deleting temporary build server...');
            $this->deleteServer($serverId);
            $serverId = null;

            // 9. Optionally delete old snapshot
            if ($this->option('delete-old') && $oldSnapshotId) {
                $this->info("Deleting old snapshot: {$oldSnapshotId}...");
                $this->deleteSnapshot($oldSnapshotId);
            }

            $this->newLine();
            $this->info("Base snapshot ready! Add this to your .env:");
            $this->newLine();
            $this->line("HETZNER_SNAPSHOT_ID={$snapshotId}");
            $this->newLine();

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Failed: {$e->getMessage()}");
            Log::error('Snapshot creation failed', ['error' => $e->getMessage()]);

            // Clean up temporary server on failure
            if ($serverId) {
                $this->warn('Cleaning up temporary server...');
                try {
                    $this->deleteServer($serverId);
                } catch (\Exception $cleanup) {
                    $this->warn("Failed to clean up server {$serverId}: {$cleanup->getMessage()}");
                }
            }

            return self::FAILURE;
        }
    }

    protected function request(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withToken($this->apiToken)
            ->baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(60);
    }

    protected function createTempServer(string $serverType, string $location): array
    {
        $sshKeyId = $this->ensureHetznerSshKey();

        $payload = [
            'name' => 'openclaw-snapshot-build-' . time(),
            'server_type' => $serverType,
            'location' => $location,
            'image' => 'ubuntu-24.04',
            'start_after_create' => true,
            'labels' => [
                'purpose' => 'snapshot-build',
                'cloudclaw' => 'true',
            ],
        ];

        if ($sshKeyId) {
            $payload['ssh_keys'] = [$sshKeyId];
        }

        $response = $this->request()->post('/servers', $payload);

        if ($response->failed()) {
            throw new \Exception('Failed to create temp server: ' . ($response->json('error.message') ?? $response->body()));
        }

        return $response->json('server');
    }

    protected function ensureHetznerSshKey(): ?int
    {
        $publicKey = app(SshKeyService::class)->getPublicKey();
        $keyName = 'cloudclaw-server';

        $response = $this->request()->get('/ssh_keys', ['name' => $keyName]);

        if ($response->successful()) {
            $existing = collect($response->json('ssh_keys', []))
                ->firstWhere('name', $keyName);

            if ($existing) {
                return $existing['id'];
            }
        }

        $response = $this->request()->post('/ssh_keys', [
            'name' => $keyName,
            'public_key' => $publicKey,
        ]);

        if ($response->successful()) {
            return $response->json('ssh_key.id');
        }

        return null;
    }

    protected function waitForSsh(string $ip, int $maxAttempts = 60, int $interval = 5): void
    {
        for ($i = 0; $i < $maxAttempts; $i++) {
            try {
                $result = \Illuminate\Support\Facades\Process::timeout(10)
                    ->run("nc -z -w 5 {$ip} 22");

                if ($result->successful()) {
                    // Give sshd a moment to fully initialize
                    sleep(3);
                    return;
                }
            } catch (\Exception $e) {
                // Timeout or other error — just retry
            }

            sleep($interval);
        }

        throw new \Exception("SSH not available on {$ip} after " . ($maxAttempts * $interval) . " seconds.");
    }

    protected function runSsh(string $ip, string $command, int $timeout = 60): string
    {
        $keyPath = app(SshKeyService::class)->getPrivateKeyPath();

        $sshCommand = sprintf(
            'ssh -i %s -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=10 -o LogLevel=ERROR root@%s %s',
            escapeshellarg($keyPath),
            escapeshellarg($ip),
            escapeshellarg($command)
        );

        $result = \Illuminate\Support\Facades\Process::timeout($timeout)->run($sshCommand);

        if (!$result->successful()) {
            throw new \Exception("SSH command failed (exit {$result->exitCode()}): {$result->errorOutput()}");
        }

        return $result->output();
    }

    protected function shutdownServer(int $serverId): void
    {
        $response = $this->request()->post("/servers/{$serverId}/actions/shutdown");

        if ($response->failed()) {
            throw new \Exception('Failed to shutdown server: ' . ($response->json('error.message') ?? $response->body()));
        }

        // Wait for server to be off
        $this->waitForServerStatus($serverId, 'off');
    }

    protected function waitForServerStatus(int $serverId, string $targetStatus, int $maxAttempts = 60, int $interval = 5): void
    {
        for ($i = 0; $i < $maxAttempts; $i++) {
            $response = $this->request()->get("/servers/{$serverId}");

            if ($response->successful() && $response->json('server.status') === $targetStatus) {
                return;
            }

            sleep($interval);
        }

        throw new \Exception("Server {$serverId} did not reach status '{$targetStatus}' after " . ($maxAttempts * $interval) . " seconds.");
    }

    protected function createSnapshot(int $serverId): int
    {
        $response = $this->request()->post("/servers/{$serverId}/actions/create_image", [
            'description' => 'OpenClaw base snapshot ' . now()->format('Y-m-d H:i'),
            'type' => 'snapshot',
            'labels' => [
                'cloudclaw' => 'true',
                'purpose' => 'base-snapshot',
            ],
        ]);

        if ($response->failed()) {
            throw new \Exception('Failed to create snapshot: ' . ($response->json('error.message') ?? $response->body()));
        }

        $imageId = $response->json('image.id');
        $actionId = $response->json('action.id');

        // Wait for snapshot creation to finish
        $this->info('Waiting for snapshot to finalize...');
        $this->waitForAction($actionId);

        return $imageId;
    }

    protected function waitForAction(int $actionId, int $maxAttempts = 120, int $interval = 5): void
    {
        for ($i = 0; $i < $maxAttempts; $i++) {
            $response = $this->request()->get("/actions/{$actionId}");

            if ($response->successful()) {
                $status = $response->json('action.status');
                if ($status === 'success') {
                    return;
                }
                if ($status === 'error') {
                    throw new \Exception('Hetzner action failed: ' . json_encode($response->json('action.error')));
                }
            }

            sleep($interval);
        }

        throw new \Exception("Action {$actionId} did not complete after " . ($maxAttempts * $interval) . " seconds.");
    }

    protected function deleteServer(int $serverId): void
    {
        $response = $this->request()->delete("/servers/{$serverId}");

        if ($response->failed() && $response->status() !== 404) {
            throw new \Exception('Failed to delete server: ' . ($response->json('error.message') ?? $response->body()));
        }
    }

    protected function deleteSnapshot(int|string $snapshotId): void
    {
        $response = $this->request()->delete("/images/{$snapshotId}");

        if ($response->failed() && $response->status() !== 404) {
            $this->warn("Failed to delete old snapshot {$snapshotId}: " . $response->body());
        } else {
            $this->info("Old snapshot {$snapshotId} deleted.");
        }
    }
}
