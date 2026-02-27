<?php

namespace App\Console\Commands;

use App\Models\Server;
use App\Services\DockerDeploymentService;
use App\Services\SshService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FixWatermarksCommand extends Command
{
    protected $signature = 'fix:watermarks {--reset-credits : Also reset user credits to their tier allocation} {--restart-stopped : Restart stopped containers and fix their watermarks too}';
    protected $description = 'Fix billing watermarks for Docker containers, optionally reset credits and restart stopped containers';

    public function handle(DockerDeploymentService $dockerService, SshService $sshService): int
    {
        // Fix running servers
        $running = Server::where('status', 'running')
            ->where('deployment_type', 'docker')
            ->whereNotNull('container_name')
            ->with('user')
            ->get();

        $this->info("Found {$running->count()} running server(s).");

        foreach ($running as $server) {
            $this->fixServer($server, $dockerService);
        }

        // Restart stopped servers
        if ($this->option('restart-stopped')) {
            $stopped = Server::where('status', 'stopped')
                ->where('deployment_type', 'docker')
                ->whereNotNull('container_name')
                ->with('user')
                ->get();

            $this->info("Found {$stopped->count()} stopped server(s) to restart.");

            foreach ($stopped as $server) {
                $user = $server->user;
                if (!$user) continue;

                // Reset credits first so the user has credits before restart
                if ($this->option('reset-credits')) {
                    $this->resetUserCredits($user);
                }

                // Only restart if user has credits
                if ((float) $user->fresh()->llm_credits <= 0) {
                    $this->warn("  Server #{$server->id}: User #{$user->id} has no credits — skipping restart");
                    continue;
                }

                $this->restartServer($server, $sshService, $dockerService);
            }
        }

        $this->info('Done.');
        return self::SUCCESS;
    }

    protected function fixServer(Server $server, DockerDeploymentService $dockerService): void
    {
        $this->info("Server #{$server->id} ({$server->container_name}):");

        try {
            $result = $dockerService->executeInContainer(
                $server,
                '. ~/.profile 2>/dev/null; . ~/.bashrc 2>/dev/null; openclaw gateway usage-cost --json 2>/dev/null',
                15
            );

            if (!$result['success'] || empty($result['stdout'])) {
                $this->warn("  Could not fetch usage cost — skipping");
                return;
            }

            $data = json_decode(trim($result['stdout']), true);
            $currentCost = (float) ($data['totals']['totalCost'] ?? 0);
            $oldWatermark = (float) ($server->llm_usage_billed ?? 0);

            $server->update(['llm_usage_billed' => $currentCost]);
            $this->info("  Watermark: {$oldWatermark} → {$currentCost}");

            if ($this->option('reset-credits') && $server->user) {
                $this->resetUserCredits($server->user);
            }

            Log::info('Watermark fixed', [
                'server_id' => $server->id,
                'old_watermark' => $oldWatermark,
                'new_watermark' => $currentCost,
            ]);
        } catch (\Exception $e) {
            $this->error("  Error: " . $e->getMessage());
        }
    }

    protected function restartServer(Server $server, SshService $sshService, DockerDeploymentService $dockerService): void
    {
        $this->info("Restarting server #{$server->id} ({$server->container_name}):");

        try {
            $hostIp = $server->docker_host_ip ?: config('services.docker.host_ip');
            if (!$hostIp) {
                $this->error("  No docker host IP — skipping");
                return;
            }

            $hostServer = new Server();
            $hostServer->ip = $hostIp;

            $sshService->execute($hostServer, 'docker start ' . escapeshellarg($server->container_name), 30);
            $this->info("  Container started");

            // Wait for container to be ready
            sleep(3);

            // Set watermark
            $result = $dockerService->executeInContainer(
                $server,
                '. ~/.profile 2>/dev/null; . ~/.bashrc 2>/dev/null; openclaw gateway usage-cost --json 2>/dev/null',
                15
            );

            $currentCost = 0;
            if ($result['success'] && !empty($result['stdout'])) {
                $data = json_decode(trim($result['stdout']), true);
                $currentCost = (float) ($data['totals']['totalCost'] ?? 0);
            }

            $server->update(['status' => 'running', 'llm_usage_billed' => $currentCost]);
            $this->info("  Status → running, watermark → {$currentCost}");

            Log::info('Stopped server restarted via fix:watermarks', [
                'server_id' => $server->id,
                'watermark' => $currentCost,
            ]);
        } catch (\Exception $e) {
            $this->error("  Restart failed: " . $e->getMessage());
        }
    }

    protected function resetUserCredits($user): void
    {
        $tier = $user->subscription_tier ?? 'starter';
        $tiers = config('services.stripe.tiers', []);
        $tierCredits = $tiers[$tier]['credits'] ?? 1000;

        $oldCredits = (float) $user->llm_credits;
        $user->update(['llm_credits' => $tierCredits]);
        $this->info("  Credits: {$oldCredits} → {$tierCredits} (user #{$user->id})");
    }
}
