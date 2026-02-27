<?php

namespace App\Console\Commands;

use App\Models\Server;
use App\Services\SshKeyService;
use App\Services\SshService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class TestSnapshotDeployCommand extends Command
{
    protected $signature = 'snapshot:test-deploy
        {--telegram-token= : Telegram bot token (or uses a dummy)}
        {--anthropic-key= : Anthropic API key (or reads from config)}
        {--cleanup : Delete the server after the test}
        {--old : Use old sequential SSH method for comparison}
        {--docker : Test Docker container deployment}';

    protected $description = 'Test deploy a server from snapshot and time each step';

    public function handle(SshService $sshService, SshKeyService $sshKeyService): int
    {
        if ($this->option('docker')) {
            return $this->runDockerMethod();
        }

        $snapshotId = config('services.hetzner.snapshot_id');
        if (!$snapshotId) {
            $this->error('HETZNER_SNAPSHOT_ID is not set.');
            return self::FAILURE;
        }

        $apiToken = config('services.hetzner.token') ?? '';
        if (empty($apiToken)) {
            $this->error('HETZNER_API_TOKEN is not set.');
            return self::FAILURE;
        }

        $telegramToken = $this->option('telegram-token') ?: 'test-token-' . Str::random(8);
        $anthropicKey = $this->option('anthropic-key') ?: config('services.anthropic.api_key') ?: 'sk-test-dummy';

        if ($this->option('old')) {
            return $this->runOldMethod($sshService, $sshKeyService, $apiToken, $snapshotId, $telegramToken, $anthropicKey);
        }

        return $this->runBatchedMethod($sshService, $sshKeyService, $apiToken, $snapshotId, $telegramToken, $anthropicKey);
    }

    /**
     * New: batched SSH — 1 call for all config instead of 10+.
     */
    protected function runBatchedMethod(
        SshService $sshService, SshKeyService $sshKeyService,
        string $apiToken, string $snapshotId, string $telegramToken, string $anthropicKey
    ): int {
        $this->info("=== Batched SSH Deploy Test (snapshot: {$snapshotId}) ===");
        $this->newLine();

        $timings = [];
        $totalStart = microtime(true);
        $serverId = null;
        $ip = null;
        $success = false;

        try {
            // --- Step 1: Create server ---
            $stepStart = microtime(true);
            $this->info('[1/3] Creating Hetzner server...');

            [$serverId, $ip, $server] = $this->createTestServer($apiToken, $sshKeyService, $snapshotId);

            $timings['Create server'] = microtime(true) - $stepStart;
            $this->line("   Server ID: {$serverId}, IP: {$ip}");
            $this->line(sprintf('   %.1fs', $timings['Create server']));

            // --- Step 2: Wait for SSH ---
            $stepStart = microtime(true);
            $this->info('[2/3] Waiting for SSH + openclaw binary...');

            $ready = false;
            for ($i = 0; $i < 40; $i++) {
                if ($sshService->isReachable($server)) {
                    $result = $sshService->execute($server, 'which openclaw && echo ready || echo wait');
                    if ($result['success'] && str_contains(trim($result['stdout']), 'ready')) {
                        $ready = true;
                        break;
                    }
                }
                sleep(3);
            }
            if (!$ready) {
                throw new \Exception('SSH/openclaw not ready after 120s');
            }

            $timings['Wait for SSH'] = microtime(true) - $stepStart;
            $this->line(sprintf('   %.1fs', $timings['Wait for SSH']));

            // --- Step 3: Configure ALL in one SSH call ---
            $stepStart = microtime(true);
            $this->info('[3/3] Configuring Telegram + LLM + daemon (single SSH call)...');

            $batchCmd = implode(' && ', [
                '. ~/.profile && . ~/.bashrc',
                'openclaw plugins enable telegram',
                'openclaw config set channels.telegram.enabled true',
                'openclaw config set channels.telegram.botToken ' . escapeshellarg($telegramToken),
                "openclaw config set channels.telegram.allowFrom '[\"*\"]'",
                "openclaw config set channels.telegram.dmPolicy '\"open\"'",
                "openclaw config set channels.telegram.groups '{\"*\":{\"requireMention\":true}}'",
                'openclaw config set env.ANTHROPIC_API_KEY ' . escapeshellarg($anthropicKey),
                'openclaw config set agents.defaults.model.primary anthropic/claude-opus-4-6',
                'openclaw daemon start',
                'sleep 1 && openclaw daemon status',
            ]);

            $result = $sshService->execute($server, $batchCmd, 120);

            if (!$result['success']) {
                $this->error('Config failed:');
                $this->line($result['stderr']);
                throw new \Exception('Batched config command failed');
            }

            $this->line('   ' . trim($result['stdout']));
            $timings['Configure + start'] = microtime(true) - $stepStart;
            $this->line(sprintf('   %.1fs', $timings['Configure + start']));

            $success = true;

        } catch (\Exception $e) {
            $this->error("Failed: {$e->getMessage()}");
        }

        // --- Summary ---
        $totalTime = microtime(true) - $totalStart;
        $this->newLine();
        $this->info('=== Timing Summary (Batched SSH) ===');
        foreach ($timings as $step => $duration) {
            $this->line(sprintf('  %-25s %6.1fs', $step, $duration));
        }
        $this->line(str_repeat('-', 40));
        $this->line(sprintf('  %-25s %6.1fs', 'TOTAL', $totalTime));
        $this->newLine();

        $this->cleanupServer($serverId, $ip, $apiToken);

        return $success ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Old: sequential SSH calls (for comparison).
     */
    protected function runOldMethod(
        SshService $sshService, SshKeyService $sshKeyService,
        string $apiToken, string $snapshotId, string $telegramToken, string $anthropicKey
    ): int {
        $this->info("=== Old Sequential SSH Deploy Test (snapshot: {$snapshotId}) ===");
        $this->newLine();

        $timings = [];
        $totalStart = microtime(true);
        $serverId = null;
        $ip = null;
        $success = false;

        try {
            $stepStart = microtime(true);
            $this->info('[1/5] Creating Hetzner server...');

            [$serverId, $ip, $server] = $this->createTestServer($apiToken, $sshKeyService, $snapshotId);

            $timings['Create server'] = microtime(true) - $stepStart;
            $this->line("   Server ID: {$serverId}, IP: {$ip}");
            $this->line(sprintf('   %.1fs', $timings['Create server']));

            // Wait for SSH
            $stepStart = microtime(true);
            $this->info('[2/5] Waiting for SSH...');

            $ready = false;
            for ($i = 0; $i < 40; $i++) {
                if ($sshService->isReachable($server)) {
                    $result = $sshService->execute($server, 'which openclaw && echo ready || echo wait');
                    if ($result['success'] && str_contains(trim($result['stdout']), 'ready')) {
                        $ready = true;
                        break;
                    }
                }
                sleep(3);
            }
            if (!$ready) {
                throw new \Exception('SSH not ready after 120s');
            }
            $timings['Wait for SSH'] = microtime(true) - $stepStart;
            $this->line(sprintf('   %.1fs', $timings['Wait for SSH']));

            // Telegram (6 separate SSH calls)
            $stepStart = microtime(true);
            $this->info('[3/5] Configuring Telegram (6 SSH calls)...');

            foreach ([
                '. ~/.profile && . ~/.bashrc && openclaw plugins enable telegram',
                '. ~/.profile && . ~/.bashrc && openclaw config set channels.telegram.enabled true',
                '. ~/.profile && . ~/.bashrc && openclaw config set channels.telegram.botToken ' . escapeshellarg($telegramToken),
                ". ~/.profile && . ~/.bashrc && openclaw config set channels.telegram.allowFrom '[\"*\"]'",
                ". ~/.profile && . ~/.bashrc && openclaw config set channels.telegram.dmPolicy '\"open\"'",
                ". ~/.profile && . ~/.bashrc && openclaw config set channels.telegram.groups '{\"*\":{\"requireMention\":true}}'",
            ] as $cmd) {
                $result = $sshService->execute($server, $cmd, 30);
                if (!$result['success']) {
                    throw new \Exception("Failed: {$cmd}\n" . $result['stderr']);
                }
            }
            $timings['Configure Telegram'] = microtime(true) - $stepStart;
            $this->line(sprintf('   %.1fs', $timings['Configure Telegram']));

            // LLM (2 SSH calls)
            $stepStart = microtime(true);
            $this->info('[4/5] Configuring LLM (2 SSH calls)...');

            foreach ([
                '. ~/.profile && . ~/.bashrc && openclaw config set env.ANTHROPIC_API_KEY ' . escapeshellarg($anthropicKey),
                '. ~/.profile && . ~/.bashrc && openclaw config set agents.defaults.model.primary anthropic/claude-opus-4-6',
            ] as $cmd) {
                $result = $sshService->execute($server, $cmd, 30);
                if (!$result['success']) {
                    throw new \Exception("Failed: {$cmd}\n" . $result['stderr']);
                }
            }
            $timings['Configure LLM'] = microtime(true) - $stepStart;
            $this->line(sprintf('   %.1fs', $timings['Configure LLM']));

            // Daemon (2 SSH calls)
            $stepStart = microtime(true);
            $this->info('[5/5] Starting daemon...');

            $sshService->execute($server, '. ~/.profile && . ~/.bashrc && openclaw daemon start', 30);
            sleep(2);
            $result = $sshService->execute($server, '. ~/.profile && . ~/.bashrc && openclaw daemon status', 15);
            $this->line('   ' . trim($result['stdout']));

            $timings['Start daemon'] = microtime(true) - $stepStart;
            $this->line(sprintf('   %.1fs', $timings['Start daemon']));

            $success = true;

        } catch (\Exception $e) {
            $this->error("Failed: {$e->getMessage()}");
        }

        $totalTime = microtime(true) - $totalStart;
        $this->newLine();
        $this->info('=== Timing Summary (Old Sequential) ===');
        foreach ($timings as $step => $duration) {
            $this->line(sprintf('  %-25s %6.1fs', $step, $duration));
        }
        $this->line(str_repeat('-', 40));
        $this->line(sprintf('  %-25s %6.1fs', 'TOTAL', $totalTime));
        $this->newLine();

        $this->cleanupServer($serverId, $ip, $apiToken);

        return $success ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Docker container deployment test.
     */
    protected function runDockerMethod(): int
    {
        $hostIp = config('services.docker.host_ip');
        if (!$hostIp) {
            $this->error('DOCKER_HOST_IP is not set. Run: php artisan docker:setup-host');
            return self::FAILURE;
        }

        $this->info("=== Docker Container Deploy Test (host: {$hostIp}) ===");
        $this->newLine();

        $telegramToken = $this->option('telegram-token') ?: 'test-token-' . Str::random(8);
        $anthropicKey = $this->option('anthropic-key') ?: config('services.anthropic.api_key') ?: 'sk-test-dummy';

        $dockerService = app(\App\Services\DockerDeploymentService::class);
        $sshService = app(\App\Services\SshService::class);

        $timings = [];
        $totalStart = microtime(true);
        $server = null;
        $success = false;

        try {
            // Create a mock user for testing
            $user = \App\Models\User::first();
            if (!$user) {
                $this->error('No users found in database for test.');
                return self::FAILURE;
            }

            // --- Step 1: Deploy container ---
            $stepStart = microtime(true);
            $this->info('[1/3] Deploying Docker container...');

            $server = $dockerService->deploy($user, $telegramToken, 'test-docker-' . time(), skipChecks: true);

            $timings['Deploy container'] = microtime(true) - $stepStart;
            $this->line("   Container: {$server->container_name}");
            $this->line(sprintf('   %.1fs', $timings['Deploy container']));

            // --- Step 2: Verify daemon ---
            $stepStart = microtime(true);
            $this->info('[2/3] Verifying daemon status...');

            $result = $sshService->execute($server, 'openclaw daemon status');
            $this->line('   ' . trim($result['stdout']));

            $timings['Verify daemon'] = microtime(true) - $stepStart;
            $this->line(sprintf('   %.1fs', $timings['Verify daemon']));

            // --- Step 3: Test usage command ---
            $stepStart = microtime(true);
            $this->info('[3/3] Testing usage query...');

            $result = $sshService->execute($server, 'openclaw gateway usage-cost --json 2>/dev/null || echo "no usage data"');
            $this->line('   ' . trim($result['stdout']));

            $timings['Usage query'] = microtime(true) - $stepStart;
            $this->line(sprintf('   %.1fs', $timings['Usage query']));

            $success = true;

        } catch (\Exception $e) {
            $this->error("Failed: {$e->getMessage()}");
        }

        // --- Summary ---
        $totalTime = microtime(true) - $totalStart;
        $this->newLine();
        $this->info('=== Timing Summary (Docker) ===');
        foreach ($timings as $step => $duration) {
            $this->line(sprintf('  %-25s %6.1fs', $step, $duration));
        }
        $this->line(str_repeat('-', 40));
        $this->line(sprintf('  %-25s %6.1fs', 'TOTAL', $totalTime));
        $this->newLine();

        // Cleanup
        if ($server && ($this->option('cleanup') || $this->confirm('Delete test container?', true))) {
            $this->info('Cleaning up test container...');
            $dockerService->deleteContainer($server);
            $server->delete();
            $this->info('Container deleted.');
        } elseif ($server) {
            $this->warn("Container left running: {$server->container_name}");
        }

        return $success ? self::SUCCESS : self::FAILURE;
    }

    protected function createTestServer(string $apiToken, SshKeyService $sshKeyService, string $snapshotId): array
    {
        $sshKeyId = $this->ensureHetznerSshKey($apiToken, $sshKeyService);
        $publicKey = $sshKeyService->getPublicKey();

        $cloudInit = "#cloud-config\nssh_authorized_keys:\n  - {$publicKey}";

        $payload = [
            'name' => 'openclaw-test-' . time(),
            'server_type' => 'cpx22',
            'location' => 'hel1',
            'image' => (int) $snapshotId,
            'start_after_create' => true,
            'user_data' => $cloudInit,
            'labels' => ['purpose' => 'test-deploy', 'cloudclaw' => 'true'],
        ];
        if ($sshKeyId) {
            $payload['ssh_keys'] = [$sshKeyId];
        }

        $response = Http::withToken($apiToken)
            ->baseUrl('https://api.hetzner.cloud/v1')
            ->acceptJson()
            ->timeout(60)
            ->post('/servers', $payload);

        if ($response->failed()) {
            throw new \Exception('Failed to create: ' . ($response->json('error.message') ?? $response->body()));
        }

        $hetznerServer = $response->json('server');
        $server = new Server();
        $server->ip = $hetznerServer['public_net']['ipv4']['ip'];
        $server->hetzner_id = $hetznerServer['id'];

        return [$hetznerServer['id'], $server->ip, $server];
    }

    protected function cleanupServer(?int $serverId, ?string $ip, string $apiToken): void
    {
        if (!$serverId) return;

        if ($this->option('cleanup') || $this->confirm('Delete test server?', true)) {
            $this->info('Cleaning up test server...');
            Http::withToken($apiToken)
                ->baseUrl('https://api.hetzner.cloud/v1')
                ->acceptJson()
                ->delete("/servers/{$serverId}");
            $this->info('Server deleted.');
        } else {
            $this->warn("Server left running (ID: {$serverId}, IP: {$ip})");
        }
    }

    protected function ensureHetznerSshKey(string $apiToken, SshKeyService $sshKeyService): ?int
    {
        $publicKey = $sshKeyService->getPublicKey();
        $keyName = 'cloudclaw-server';

        $http = Http::withToken($apiToken)->baseUrl('https://api.hetzner.cloud/v1')->acceptJson()->timeout(30);

        $response = $http->get('/ssh_keys', ['name' => $keyName]);
        if ($response->successful()) {
            $existing = collect($response->json('ssh_keys', []))->firstWhere('name', $keyName);
            if ($existing) return $existing['id'];
        }

        $response = $http->post('/ssh_keys', ['name' => $keyName, 'public_key' => $publicKey]);
        return $response->successful() ? $response->json('ssh_key.id') : null;
    }
}
