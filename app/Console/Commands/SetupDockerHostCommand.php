<?php

namespace App\Console\Commands;

use App\Models\DockerHost;
use App\Services\SshKeyService;
use App\Services\SshService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;

class SetupDockerHostCommand extends Command
{
    protected $signature = 'docker:setup-host
        {--ip= : Use an existing server IP instead of creating a new one}
        {--server-type=cpx42 : Hetzner server type (default: cpx42 — 8 cores, 16GB)}
        {--location=hel1 : Hetzner datacenter location}
        {--rebuild-image : Force rebuild the Docker image on the host}';

    protected $description = 'Provision and configure a Docker host for container-based OpenClaw deployment';

    public function handle(SshService $sshService, SshKeyService $sshKeyService): int
    {
        $ip = $this->option('ip');
        $hetznerId = null;

        if (!$ip) {
            $result = $this->createHetznerHost($sshKeyService);
            if (!$result) {
                return self::FAILURE;
            }
            $ip = $result['ip'];
            $hetznerId = $result['hetzner_id'];
        }

        $this->info("Docker host IP: {$ip}");

        // Wait for SSH
        $this->info('Waiting for SSH access...');
        $hostServer = new \App\Models\Server();
        $hostServer->ip = $ip;

        $ready = false;
        for ($i = 0; $i < 60; $i++) {
            $result = $sshService->execute($hostServer, 'echo ok', 10);
            if ($result['success'] && str_contains($result['stdout'], 'ok')) {
                $ready = true;
                break;
            }
            sleep(3);
        }

        if (!$ready) {
            $this->error('SSH not reachable after 180s.');
            return self::FAILURE;
        }
        $this->info('SSH is ready.');

        // Install Docker
        $this->info('Installing Docker...');
        $result = $sshService->execute($hostServer, 'which docker || (curl -fsSL https://get.docker.com | bash)', 120);
        if (!$result['success']) {
            $this->error('Failed to install Docker: ' . $result['stderr']);
            return self::FAILURE;
        }
        $this->info('Docker installed.');

        // Copy Dockerfile and entrypoint to host
        $this->info('Uploading Dockerfile and entrypoint...');
        $keyPath = $sshKeyService->getPrivateKeyPath();
        $dockerDir = base_path('docker/openclaw');

        // Remove old build dir and upload fresh files
        $sshService->execute($hostServer, 'rm -rf /root/openclaw-build && mkdir -p /root/openclaw-build', 10);

        $scpCmd = sprintf(
            'scp -i %s -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR %s/Dockerfile %s/entrypoint.sh root@%s:/root/openclaw-build/',
            escapeshellarg($keyPath),
            escapeshellarg($dockerDir),
            escapeshellarg($dockerDir),
            escapeshellarg($ip)
        );
        $scpResult = Process::timeout(30)->run($scpCmd);
        if (!$scpResult->successful()) {
            $this->error('Failed to upload build files: ' . $scpResult->errorOutput());
            return self::FAILURE;
        }

        // Build the Docker image
        $this->info('Building Docker image (this may take a few minutes)...');
        $noCache = $this->option('rebuild-image') ? ' --no-cache' : '';
        $result = $sshService->execute(
            $hostServer,
            'cd /root/openclaw-build && docker build' . $noCache . ' -t cloudclaw/openclaw:latest .',
            600
        );
        if (!$result['success']) {
            $this->error('Docker build failed: ' . $result['stderr']);
            return self::FAILURE;
        }
        $this->info('Docker image built successfully.');

        // Register in docker_hosts table
        $dockerHost = DockerHost::updateOrCreate(
            ['ip' => $ip],
            [
                'name' => 'cloudclaw-docker-host',
                'hetzner_id' => $hetznerId,
                'server_type' => $this->option('server-type'),
                'location' => $this->option('location'),
                'status' => 'ready',
                'max_containers' => config('services.docker.max_containers', 12),
                'ready_at' => now(),
            ]
        );
        $this->info("Registered DockerHost #{$dockerHost->id} in database.");

        // Update .env
        $this->updateEnvFile($ip);

        $this->newLine();
        $this->info('Docker host is ready!');
        $this->line("  Host IP: {$ip}");
        $this->line('  Image: cloudclaw/openclaw:latest');
        $this->line('  DOCKER_HOST_IP and DOCKER_DEPLOY_ENABLED have been set in .env');
        $this->newLine();
        $this->info('Test with: php artisan snapshot:test-deploy --docker --cleanup');

        return self::SUCCESS;
    }

    protected function createHetznerHost(SshKeyService $sshKeyService): ?array
    {
        $apiToken = config('services.hetzner.token') ?? '';
        if (empty($apiToken)) {
            $this->error('HETZNER_API_TOKEN is not set.');
            return null;
        }

        $this->info('Creating Hetzner Docker host...');

        // Ensure SSH key
        $publicKey = $sshKeyService->getPublicKey();
        $keyName = 'cloudclaw-server';
        $http = Http::withToken($apiToken)->baseUrl('https://api.hetzner.cloud/v1')->acceptJson()->timeout(60);

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
            'name' => 'cloudclaw-docker-host',
            'server_type' => $this->option('server-type'),
            'location' => $this->option('location'),
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
            $this->error('Failed to create server: ' . ($response->json('error.message') ?? $response->body()));
            return null;
        }

        $ip = $response->json('server.public_net.ipv4.ip');
        $hetznerServerId = $response->json('server.id');
        $this->info("Hetzner server created (ID: {$hetznerServerId})");

        return ['ip' => $ip, 'hetzner_id' => $hetznerServerId];
    }

    protected function updateEnvFile(string $ip): void
    {
        $envPath = base_path('.env');
        if (!file_exists($envPath)) {
            return;
        }

        $env = file_get_contents($envPath);

        // Update or add DOCKER_HOST_IP
        if (str_contains($env, 'DOCKER_HOST_IP=')) {
            $env = preg_replace('/^DOCKER_HOST_IP=.*/m', "DOCKER_HOST_IP={$ip}", $env);
        } else {
            $env .= "\n\n# Docker Deployment\nDOCKER_HOST_IP={$ip}\n";
        }

        // Update or add DOCKER_DEPLOY_ENABLED
        if (str_contains($env, 'DOCKER_DEPLOY_ENABLED=')) {
            $env = preg_replace('/^DOCKER_DEPLOY_ENABLED=.*/m', 'DOCKER_DEPLOY_ENABLED=true', $env);
        } else {
            $env .= "DOCKER_DEPLOY_ENABLED=true\n";
        }

        file_put_contents($envPath, $env);
    }
}
