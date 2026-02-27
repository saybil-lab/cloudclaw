<?php

namespace App\Console\Commands;

use App\Models\CreditTransaction;
use App\Models\Server;
use App\Models\User;
use App\Services\SshService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncLlmUsageCommand extends Command
{
    protected $signature = 'usage:sync-llm';
    protected $description = 'Poll running servers for LLM usage, deduct AI credits, and enforce zero-balance shutoff';

    public function __construct(protected SshService $sshService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $servers = Server::where('status', 'running')
            ->whereHas('user', fn ($q) => $q->where('llm_billing_mode', 'credits'))
            ->with('user')
            ->get();

        if ($servers->isEmpty()) {
            $this->info('No credits-mode servers to sync.');
            return self::SUCCESS;
        }

        $this->info("Syncing LLM usage for {$servers->count()} server(s)...");

        foreach ($servers as $server) {
            $this->syncServer($server);
        }

        $this->info('Done.');
        return self::SUCCESS;
    }

    protected function syncServer(Server $server): void
    {
        $user = $server->user;
        if (!$user || $user->llm_billing_mode !== 'credits') {
            return;
        }

        try {
            $totalCost = $this->fetchUsageCost($server);

            if ($totalCost === null || $totalCost <= 0) {
                return;
            }

            $previouslyBilled = (float) ($server->llm_usage_billed ?? 0);
            $newUsageDollars = round($totalCost - $previouslyBilled, 4);

            if ($newUsageDollars <= 0.001) {
                return;
            }

            // Safety: if watermark was never set (0) and there's significant accumulated usage,
            // auto-set watermark to current total instead of billing all historical usage at once.
            if ($previouslyBilled == 0 && $totalCost > 0.50) {
                Log::warning('SyncLlmUsage: Watermark was 0 with significant usage — auto-setting watermark', [
                    'server_id' => $server->id,
                    'total_cost' => $totalCost,
                ]);
                $server->update(['llm_usage_billed' => $totalCost]);
                $this->warn("  [Server {$server->id}] Auto-set watermark to \${$totalCost} (skipping stale usage)");
                return;
            }

            // Convert dollar cost to credit units
            $creditsPerDollar = (int) config('services.stripe.credits_per_dollar', 250);
            $newUsageCredits = round($newUsageDollars * $creditsPerDollar, 2);

            // Safety cap: max 200 credits per sync cycle (~$0.80 of API usage per minute)
            if ($newUsageCredits > 200) {
                Log::warning('SyncLlmUsage: Deduction capped', [
                    'server_id' => $server->id,
                    'calculated' => $newUsageCredits,
                    'capped_to' => 200,
                ]);
                $newUsageCredits = 200;
            }

            $this->deductCredits($user, $server, $newUsageCredits, $totalCost);

        } catch (\Exception $e) {
            $this->error("  [Server {$server->id}] Error: " . $e->getMessage());
            Log::error('SyncLlmUsage: failed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Fetch total LLM usage cost from the server via SSH.
     * Uses `openclaw gateway usage-cost --json` which returns:
     * { "totals": { "totalCost": 0.088, ... }, "daily": [...] }
     */
    protected function fetchUsageCost(Server $server): ?float
    {
        $cmd = '. ~/.profile 2>/dev/null; . ~/.bashrc 2>/dev/null; openclaw gateway usage-cost --json 2>/dev/null';
        $result = $this->sshService->execute($server, $cmd, 15);

        if (!$result['success'] || empty($result['stdout'])) {
            return null;
        }

        $data = json_decode(trim($result['stdout']), true);

        if (!is_array($data) || !isset($data['totals']['totalCost'])) {
            $this->warn("  [Server {$server->id}] Unexpected usage-cost response");
            return null;
        }

        return (float) $data['totals']['totalCost'];
    }

    /**
     * Deduct credits with a full audit trail and enforce zero-balance.
     */
    protected function deductCredits(User $user, Server $server, float $newUsage, float $totalCost): void
    {
        // Use a DB transaction for atomicity
        DB::transaction(function () use ($user, $server, $newUsage, $totalCost) {
            // Re-read with lock to prevent race conditions
            $user = User::lockForUpdate()->find($user->id);
            $currentCredits = (float) $user->llm_credits;
            $deduction = min($newUsage, max($currentCredits, 0));

            if ($deduction > 0) {
                $user->decrement('llm_credits', $deduction);

                CreditTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'llm_usage',
                    'amount' => -$deduction,
                    'balance_after' => $currentCredits - $deduction,
                    'description' => "AI usage on server #{$server->id}",
                    'server_id' => $server->id,
                ]);

                $this->info("  [Server {$server->id}] Deducted {$deduction} credits (remaining: " . ($currentCredits - $deduction) . ")");
            }

            // Always update the billed watermark so we don't re-bill
            $server->update(['llm_usage_billed' => $totalCost]);

            // Track unbilled overage (usage beyond what user had credits for)
            $overage = $newUsage - $deduction;
            if ($overage > 0.001) {
                Log::warning('LLM usage exceeded credits', [
                    'user_id' => $user->id,
                    'server_id' => $server->id,
                    'overage' => $overage,
                ]);
            }
        });

        // Check remaining balance and enforce shutoff
        $user->refresh();
        $remaining = (float) $user->llm_credits;

        if ($remaining <= 0) {
            $this->warn("  [Server {$server->id}] Credits depleted — stopping OpenClaw daemon");
            Log::warning('LLM credits depleted, stopping daemon', [
                'user_id' => $user->id,
                'server_id' => $server->id,
            ]);
            $this->stopDaemon($server);
        } elseif ($remaining <= 50) {
            Log::warning('LLM credits running low', [
                'user_id' => $user->id,
                'remaining' => $remaining,
            ]);
        }
    }

    /**
     * Stop the OpenClaw daemon on a server when credits are depleted.
     */
    protected function stopDaemon(Server $server): void
    {
        try {
            if ($server->isDocker()) {
                // Docker: stop the container from the host
                $hostIp = $server->docker_host_ip ?: config('services.docker.host_ip');
                if ($hostIp) {
                    $hostServer = new Server();
                    $hostServer->ip = $hostIp;
                    $this->sshService->execute($hostServer, 'docker stop ' . escapeshellarg($server->container_name), 15);
                    $server->update(['status' => 'stopped']);
                }
            } else {
                // VM: stop via systemd daemon command
                $cmd = '. ~/.profile && . ~/.bashrc && openclaw daemon stop 2>/dev/null';
                $this->sshService->execute($server, $cmd, 15);
            }
        } catch (\Exception $e) {
            Log::error('Failed to stop daemon on depleted server', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
