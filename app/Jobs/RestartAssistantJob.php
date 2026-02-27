<?php

namespace App\Jobs;

use App\Models\Server;
use App\Models\User;
use App\Services\SshService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RestartAssistantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;
    public int $tries = 2;

    public function __construct(
        protected int $userId
    ) {}

    public function handle(SshService $sshService): void
    {
        $user = User::find($this->userId);
        if (!$user) return;

        // Only restart if user has credits
        if ((float) $user->llm_credits <= 0) {
            Log::info('RestartAssistantJob: User has no credits, skipping', ['user_id' => $this->userId]);
            return;
        }

        // Find the user's stopped server
        $server = $user->servers()
            ->where('status', 'stopped')
            ->whereNotNull('container_name')
            ->latest()
            ->first();

        if (!$server) {
            Log::info('RestartAssistantJob: No stopped server found', ['user_id' => $this->userId]);
            return;
        }

        try {
            $hostIp = $server->docker_host_ip ?: config('services.docker.host_ip');
            if (!$hostIp) {
                Log::error('RestartAssistantJob: No docker host IP', ['server_id' => $server->id]);
                return;
            }

            $hostServer = new Server();
            $hostServer->ip = $hostIp;

            $sshService->execute($hostServer, 'docker start ' . escapeshellarg($server->container_name), 30);

            // Fetch current usage total so we only bill NEW usage from this point
            sleep(3); // give container a moment to start
            $cmd = 'docker exec ' . escapeshellarg($server->container_name)
                . ' bash -c \'export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"; . ~/.profile 2>/dev/null; openclaw gateway usage-cost --json 2>/dev/null\'';
            $usageResult = $sshService->execute($hostServer, $cmd, 15);
            $currentCost = 0;
            if ($usageResult['success'] && !empty($usageResult['stdout'])) {
                $data = json_decode(trim($usageResult['stdout']), true);
                $currentCost = (float) ($data['totals']['totalCost'] ?? 0);
            }

            $server->update(['status' => 'running', 'llm_usage_billed' => $currentCost]);

            Log::info('RestartAssistantJob: Container restarted', [
                'user_id' => $this->userId,
                'server_id' => $server->id,
                'container' => $server->container_name,
            ]);
        } catch (\Exception $e) {
            Log::error('RestartAssistantJob: Failed to restart', [
                'user_id' => $this->userId,
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
