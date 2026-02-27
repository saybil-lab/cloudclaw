<?php

namespace App\Jobs;

use App\Models\Server;
use App\Services\SshService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncLlmKeyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 2;

    public function __construct(
        protected Server $server,
        protected string $provider,
        protected string $apiKey,
        protected string $model = 'anthropic/claude-opus-4-6',
    ) {}

    public function handle(SshService $sshService): void
    {
        $server = $this->server;

        Log::info('Syncing LLM API key to server', [
            'server_id' => $server->id,
            'provider' => $this->provider,
        ]);

        try {
            if (!$sshService->isReachable($server)) {
                throw new \Exception('Server is not reachable via SSH');
            }

            // Determine the env var name based on provider
            $envVar = match ($this->provider) {
                'anthropic' => 'ANTHROPIC_API_KEY',
                'openai' => 'OPENAI_API_KEY',
                default => throw new \Exception("Unsupported provider: {$this->provider}"),
            };

            if ($server->isDocker()) {
                // Docker: set config via docker exec, then restart container from host
                $configCmd = implode(' && ', [
                    'openclaw config set env.' . $envVar . ' ' . escapeshellarg($this->apiKey),
                    'openclaw config set agents.defaults.model.primary ' . escapeshellarg($this->model),
                ]);

                $result = $sshService->execute($server, $configCmd, 60);
                if (!$result['success']) {
                    Log::warning('SyncLlmKeyJob config command failed (docker)', [
                        'server_id' => $server->id,
                        'stderr' => $result['stderr'],
                    ]);
                }

                // Restart container from the host to pick up new config
                $hostIp = $server->docker_host_ip ?: config('services.docker.host_ip');
                if ($hostIp) {
                    $hostServer = new Server();
                    $hostServer->ip = $hostIp;
                    $sshService->execute($hostServer, 'docker restart ' . escapeshellarg($server->container_name), 30);
                }
            } else {
                // VM: batch all commands in a single SSH call
                $batchCmd = implode(' && ', [
                    '. ~/.profile && . ~/.bashrc',
                    'openclaw config set env.' . $envVar . ' ' . escapeshellarg($this->apiKey),
                    'openclaw config set agents.defaults.model.primary ' . escapeshellarg($this->model),
                    'openclaw daemon start',
                ]);

                $result = $sshService->execute($server, $batchCmd, 60);
                if (!$result['success']) {
                    Log::warning('SyncLlmKeyJob batch command failed', [
                        'server_id' => $server->id,
                        'stderr' => $result['stderr'],
                    ]);
                }
            }

            Log::info('LLM API key synced successfully', ['server_id' => $server->id]);

        } catch (\Exception $e) {
            Log::error('Failed to sync LLM API key', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
