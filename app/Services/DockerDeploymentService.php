<?php

namespace App\Services;

use App\Models\DockerHost;
use App\Models\Server;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DockerDeploymentService
{
    protected SshKeyService $sshKeyService;
    protected SshService $sshService;

    public function __construct(SshKeyService $sshKeyService, SshService $sshService)
    {
        $this->sshKeyService = $sshKeyService;
        $this->sshService = $sshService;
    }

    protected function selectHost(): DockerHost
    {
        // Pick ready host with most available slots
        $host = DockerHost::where('status', 'ready')->get()
            ->sortByDesc(fn ($h) => $h->availableSlots())
            ->first(fn ($h) => $h->availableSlots() > 0);

        if (!$host) {
            // Fallback: legacy single-host from config
            $ip = config('services.docker.host_ip');
            if (!$ip) {
                throw new \Exception('No Docker hosts available. Run: php artisan docker:setup-host');
            }
            $host = DockerHost::firstOrCreate(['ip' => $ip], [
                'name' => 'legacy-docker-host',
                'status' => 'ready',
                'max_containers' => config('services.docker.max_containers', 12),
            ]);
        }

        return $host;
    }

    /**
     * Deploy an OpenClaw container on the Docker host.
     * Synchronous — completes in ~5-10s, no background job needed.
     */
    public function deploy(User $user, string $telegramToken, ?string $name = null, bool $skipChecks = false): Server
    {
        if (!$skipChecks && !$user->hasActiveSubscription()) {
            throw new \Exception('An active subscription is required to deploy.');
        }

        if (!$name) {
            $name = 'openclaw-' . Str::slug($user->name) . '-' . Str::random(4);
        }

        $host = $this->selectHost();
        $hostIp = $host->ip;

        $server = Server::create([
            'user_id' => $user->id,
            'name' => $name,
            'server_type' => 'docker',
            'datacenter' => 'docker-host',
            'monthly_price' => 1.99,
            'status' => 'provisioning',
            'provision_status' => 'provisioning',
            'deployment_type' => 'docker',
            'docker_host_ip' => $hostIp,
            'docker_host_id' => $host->id,
            'container_name' => 'oc-' . $name,
            'telegram_token' => $telegramToken,
            'ip' => $hostIp,
        ]);

        try {
            $server->appendProvisionLog('Starting Docker container...');

            // Build env vars for the container
            $envFlags = $this->buildEnvFlags($user, $telegramToken);
            $memoryLimit = config('services.docker.memory_limit', '1g');
            $cpuLimit = config('services.docker.cpu_limit', '1');

            $dockerCmd = sprintf(
                'docker run -d --name %s --memory=%s --cpus=%s --restart=unless-stopped -v %s-data:/root/.openclaw %s cloudclaw/openclaw:latest',
                escapeshellarg($server->container_name),
                escapeshellarg($memoryLimit),
                escapeshellarg($cpuLimit),
                escapeshellarg($server->container_name),
                $envFlags
            );

            $result = $this->sshToHost($hostIp, $dockerCmd, 30);

            if (!$result['success']) {
                throw new \Exception('Failed to start container: ' . $result['stderr']);
            }

            $server->appendProvisionLog('Container started. Waiting for daemon...');

            // Wait for the gateway to be ready (entrypoint runs `openclaw gateway` as PID 1)
            $ready = false;
            for ($i = 0; $i < 15; $i++) {
                sleep(1);
                $status = $this->getContainerStatus($server);
                if ($status === 'running') {
                    // Probe the gateway websocket port
                    $check = $this->executeInContainer($server, 'curl -sf http://127.0.0.1:18789/ >/dev/null 2>&1 && echo ready || echo waiting', 5);
                    if ($check['success'] && str_contains($check['stdout'], 'ready')) {
                        $ready = true;
                        break;
                    }
                }
            }

            if (!$ready) {
                Log::warning('Docker container daemon not confirmed ready, but container is running', [
                    'server_id' => $server->id,
                ]);
            }

            // Set the usage watermark to the current total so we only bill NEW usage
            $initialCost = $this->fetchCurrentUsageCost($server);
            $server->update([
                'status' => 'running',
                'provision_status' => 'ready',
                'llm_usage_billed' => $initialCost,
            ]);
            $server->appendProvisionLog("Container deployed and running.\nOpenClaw is connected to Telegram.");

            Log::info('Docker deployment completed', [
                'server_id' => $server->id,
                'container' => $server->container_name,
                'user_id' => $user->id,
                'docker_host_id' => $host->id,
            ]);

            // Check if we need to provision more capacity
            Artisan::queue('docker:ensure-capacity');

            return $server->fresh();

        } catch (\Exception $e) {
            $server->update([
                'status' => 'error',
                'provision_status' => 'failed',
            ]);
            $server->appendProvisionLog('ERROR: ' . $e->getMessage());

            Log::error('Docker deployment failed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Fetch the current cumulative usage cost from a running container.
     * Used to set the billing watermark so only new usage is charged.
     */
    protected function fetchCurrentUsageCost(Server $server): float
    {
        try {
            $result = $this->executeInContainer(
                $server,
                '. ~/.profile 2>/dev/null; . ~/.bashrc 2>/dev/null; openclaw gateway usage-cost --json 2>/dev/null',
                15
            );

            if (!$result['success'] || empty($result['stdout'])) {
                return 0;
            }

            $data = json_decode(trim($result['stdout']), true);
            return (float) ($data['totals']['totalCost'] ?? 0);
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Delete a container and its data volume.
     */
    public function deleteContainer(Server $server): bool
    {
        $hostIp = $server->docker_host_ip ?: $this->getHostIp();

        $this->sshToHost($hostIp, sprintf(
            'docker rm -f %s 2>/dev/null; docker volume rm %s-data 2>/dev/null',
            escapeshellarg($server->container_name),
            escapeshellarg($server->container_name)
        ), 15);

        $server->update(['status' => 'deleted']);

        Log::info('Docker container deleted', ['server_id' => $server->id]);

        return true;
    }

    /**
     * Execute a command inside a container.
     *
     * @return array{stdout: string, stderr: string, exitCode: int, success: bool}
     */
    public function executeInContainer(Server $server, string $command, int $timeout = 30): array
    {
        $hostIp = $server->docker_host_ip ?: $this->getHostIp();

        $dockerCmd = sprintf(
            'docker exec %s bash -c %s',
            escapeshellarg($server->container_name),
            escapeshellarg('export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"; ' . $command)
        );

        return $this->sshToHost($hostIp, $dockerCmd, $timeout);
    }

    /**
     * Get the status of a container.
     */
    public function getContainerStatus(Server $server): string
    {
        $hostIp = $server->docker_host_ip ?: $this->getHostIp();

        $result = $this->sshToHost($hostIp, sprintf(
            "docker inspect --format='{{.State.Status}}' %s 2>/dev/null || echo not_found",
            escapeshellarg($server->container_name)
        ), 10);

        return trim($result['stdout']) ?: 'unknown';
    }

    /**
     * Build -e flags for docker run from user config.
     */
    protected function buildEnvFlags(User $user, string $telegramToken): string
    {
        $flags = ['-e TELEGRAM_TOKEN=' . escapeshellarg($telegramToken)];

        if ($user->llm_billing_mode === 'byok') {
            if ($user->anthropic_api_key) {
                $flags[] = '-e ANTHROPIC_API_KEY=' . escapeshellarg($user->anthropic_api_key);
            } elseif ($user->openai_api_key) {
                $flags[] = '-e OPENAI_API_KEY=' . escapeshellarg($user->openai_api_key);
            }
        } else {
            $platformKey = config('services.anthropic.api_key');
            if ($platformKey) {
                $flags[] = '-e ANTHROPIC_API_KEY=' . escapeshellarg($platformKey);
            }
        }

        return implode(' ', $flags);
    }

    /**
     * SSH to the Docker host and run a command.
     *
     * @return array{stdout: string, stderr: string, exitCode: int, success: bool}
     */
    protected function sshToHost(string $hostIp, string $command, int $timeout = 30): array
    {
        // Create a temporary Server-like object to reuse SshService
        $hostServer = new Server();
        $hostServer->ip = $hostIp;

        return $this->sshService->execute($hostServer, $command, $timeout);
    }
}
