<?php

namespace App\Jobs;

use App\Models\DockerHost;
use App\Services\SshKeyService;
use App\Services\SshService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class ProvisionDockerHostJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 900; // 15 minutes
    public int $tries = 1;

    public function __construct(
        protected int $dockerHostId,
        protected string $serverType = 'cpx42',
        protected string $location = 'hel1',
    ) {}

    public function handle(SshService $sshService, SshKeyService $sshKeyService): void
    {
        $host = DockerHost::find($this->dockerHostId);
        if (!$host) {
            Log::error('ProvisionDockerHostJob: host not found', ['id' => $this->dockerHostId]);
            return;
        }

        try {
            $host->appendProvisionLog('Starting provisioning...');

            // 1. Create Hetzner VM
            $result = $this->createHetznerVm($host, $sshKeyService);
            $host->update(['ip' => $result['ip'], 'hetzner_id' => $result['hetzner_id']]);
            $host->appendProvisionLog("Hetzner VM created (ID: {$result['hetzner_id']}, IP: {$result['ip']})");

            // 2. Wait for SSH
            $hostServer = new \App\Models\Server();
            $hostServer->ip = $result['ip'];

            $host->appendProvisionLog('Waiting for SSH...');
            $sshReady = false;
            for ($i = 0; $i < 60; $i++) {
                $check = $sshService->execute($hostServer, 'echo ok', 10);
                if ($check['success'] && str_contains($check['stdout'], 'ok')) {
                    $sshReady = true;
                    break;
                }
                sleep(3);
            }
            if (!$sshReady) {
                throw new \Exception('SSH not reachable after 180s');
            }
            $host->appendProvisionLog('SSH ready.');

            // 3. Install Docker
            $host->appendProvisionLog('Installing Docker...');
            $dockerInstall = $sshService->execute($hostServer, 'which docker || (curl -fsSL https://get.docker.com | bash)', 120);
            if (!$dockerInstall['success']) {
                throw new \Exception('Docker install failed: ' . $dockerInstall['stderr']);
            }
            $host->appendProvisionLog('Docker installed.');

            // 4. SCP Dockerfile + entrypoint, build image
            $host->appendProvisionLog('Uploading build files...');
            $keyPath = $sshKeyService->getPrivateKeyPath();
            $dockerDir = base_path('docker/openclaw');

            $sshService->execute($hostServer, 'rm -rf /root/openclaw-build && mkdir -p /root/openclaw-build', 10);

            $scpCmd = sprintf(
                'scp -i %s -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR %s/Dockerfile %s/entrypoint.sh root@%s:/root/openclaw-build/',
                escapeshellarg($keyPath),
                escapeshellarg($dockerDir),
                escapeshellarg($dockerDir),
                escapeshellarg($result['ip'])
            );
            $scpResult = Process::timeout(30)->run($scpCmd);
            if (!$scpResult->successful()) {
                throw new \Exception('SCP failed: ' . $scpResult->errorOutput());
            }

            $host->appendProvisionLog('Building Docker image...');
            $buildResult = $sshService->execute(
                $hostServer,
                'cd /root/openclaw-build && docker build -t cloudclaw/openclaw:latest .',
                600
            );
            if (!$buildResult['success']) {
                throw new \Exception('Docker build failed: ' . $buildResult['stderr']);
            }
            $host->appendProvisionLog('Docker image built.');

            // 5. Mark host as ready
            $host->update([
                'status' => 'ready',
                'ready_at' => now(),
            ]);
            $host->appendProvisionLog('Host is ready.');

            Log::info('Docker host provisioned', [
                'docker_host_id' => $host->id,
                'ip' => $host->ip,
            ]);

        } catch (\Exception $e) {
            $host->update(['status' => 'error']);
            $host->appendProvisionLog('ERROR: ' . $e->getMessage());

            Log::error('Docker host provisioning failed', [
                'docker_host_id' => $host->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function createHetznerVm(DockerHost $host, SshKeyService $sshKeyService): array
    {
        $apiToken = config('services.hetzner.token');
        if (empty($apiToken)) {
            throw new \Exception('HETZNER_API_TOKEN is not set');
        }

        $publicKey = $sshKeyService->getPublicKey();
        $keyName = 'cloudclaw-server';
        $http = Http::withToken($apiToken)->baseUrl('https://api.hetzner.cloud/v1')->acceptJson()->timeout(60);

        // Ensure SSH key exists
        $sshKeyId = null;
        $response = $http->get('/ssh_keys', ['name' => $keyName]);
        if ($response->successful()) {
            $existing = collect($response->json('ssh_keys', []))->firstWhere('name', $keyName);
            if ($existing) {
                $sshKeyId = $existing['id'];
            }
        }
        if (!$sshKeyId) {
            $response = $http->post('/ssh_keys', ['name' => $keyName, 'public_key' => $publicKey]);
            $sshKeyId = $response->successful() ? $response->json('ssh_key.id') : null;
        }

        $payload = [
            'name' => $host->name,
            'server_type' => $this->serverType,
            'location' => $this->location,
            'image' => 'ubuntu-24.04',
            'start_after_create' => true,
            'labels' => ['cloudclaw' => 'true', 'role' => 'docker-host'],
            'user_data' => "#cloud-config\nssh_authorized_keys:\n  - {$publicKey}",
        ];
        if ($sshKeyId) {
            $payload['ssh_keys'] = [$sshKeyId];
        }

        $response = $http->post('/servers', $payload);
        if ($response->failed()) {
            throw new \Exception('Hetzner create failed: ' . ($response->json('error.message') ?? $response->body()));
        }

        return [
            'ip' => $response->json('server.public_net.ipv4.ip'),
            'hetzner_id' => $response->json('server.id'),
        ];
    }
}
