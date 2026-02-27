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

class InstallOpenClawJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600; // 10 minutes
    public int $tries = 1;

    protected Server $server;
    protected string $telegramToken;

    public function __construct(Server $server, string $telegramToken)
    {
        $this->server = $server;
        $this->telegramToken = $telegramToken;
    }

    public function handle(SshService $sshService): void
    {
        $server = $this->server;

        Log::info('[InstallOpenClaw] Starting', ['server_id' => $server->id, 'ip' => $server->ip]);

        try {
            $server->update(['provision_log' => "Booting VM..."]);

            $isSnapshot = $this->isSnapshotDeploy();
            $maxWait = $isSnapshot ? 120 : 300;
            $startTime = time();
            $isReady = false;

            // --- Phase 1: Wait for SSH ---
            while (time() - $startTime < $maxWait) {
                if ($sshService->isReachable($server)) {
                    if ($isSnapshot) {
                        $result = $sshService->execute($server, 'which openclaw && echo ready || echo wait');
                    } else {
                        $result = $sshService->execute($server, 'test -f /var/log/cloudclaw_ready && echo ready || echo wait');
                    }

                    if ($result['success'] && trim($result['stdout']) === 'ready') {
                        $isReady = true;
                        break;
                    }
                }

                sleep($isSnapshot ? 3 : 5);
            }

            $sshElapsed = time() - $startTime;
            Log::info('[InstallOpenClaw] SSH wait done', [
                'server_id' => $server->id,
                'elapsed' => $sshElapsed,
                'ready' => $isReady,
            ]);

            if (!$isReady) {
                throw new \Exception("Server SSH not available after {$sshElapsed} seconds.");
            }

            $server->appendProvisionLog("\nSSH is ready ({$sshElapsed}s). Configuring OpenClaw...");

            // --- Phase 2: Configure everything in ONE batched SSH call ---
            $configStart = time();

            $configCmd = $isSnapshot
                ? $this->buildSnapshotConfigCommand($server)
                : $this->buildFullInstallCommand($server);

            $server->appendProvisionLog("\nConfiguring Telegram, AI, and starting daemon...");

            $result = $sshService->execute($server, $configCmd, $isSnapshot ? 120 : 300);

            $configElapsed = time() - $configStart;
            Log::info('[InstallOpenClaw] Config done', [
                'server_id' => $server->id,
                'elapsed' => $configElapsed,
                'success' => $result['success'],
                'stdout' => substr($result['stdout'], -500),
                'stderr' => substr($result['stderr'], -500),
            ]);

            if (!$result['success']) {
                throw new \Exception("Configuration failed ({$configElapsed}s):\n" . $result['stderr']);
            }

            if ($result['stdout']) {
                $server->appendProvisionLog($result['stdout']);
            }

            // --- Done ---
            $totalElapsed = time() - $startTime;
            $server->update([
                'status' => 'running',
                'provision_status' => 'ready',
                'provision_log' => $server->provision_log
                    . "\n\nInstallation complete! ({$totalElapsed}s total)"
                    . "\nOpenClaw is running and connected to Telegram.",
            ]);

            Log::info('[InstallOpenClaw] Completed', [
                'server_id' => $server->id,
                'ssh_wait' => $sshElapsed,
                'config' => $configElapsed,
                'total' => $totalElapsed,
            ]);

        } catch (\Exception $e) {
            Log::error('[InstallOpenClaw] Failed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);

            $server->update([
                'status' => 'error',
                'provision_status' => 'failed',
                'provision_log' => $server->provision_log . "\n\nERROR: " . $e->getMessage(),
            ]);
        }
    }

    /**
     * Single batched command for snapshot deploy: Telegram + LLM + daemon start.
     * Runs in 1 SSH session instead of 10+ separate connections.
     */
    protected function buildSnapshotConfigCommand(Server $server): string
    {
        $parts = [
            '. ~/.profile && . ~/.bashrc',
            'openclaw plugins enable telegram',
            'openclaw config set channels.telegram.enabled true',
            'openclaw config set channels.telegram.botToken ' . escapeshellarg($this->telegramToken),
            "openclaw config set channels.telegram.allowFrom '[\"*\"]'",
            "openclaw config set channels.telegram.dmPolicy '\"open\"'",
            "openclaw config set channels.telegram.groups '{\"*\":{\"requireMention\":true}}'",
        ];

        // LLM config
        $parts = array_merge($parts, $this->getLlmConfigParts($server));

        // Start daemon
        $parts[] = 'openclaw daemon start';
        $parts[] = 'sleep 1 && openclaw daemon status';

        return implode(' && ', $parts);
    }

    /**
     * Single batched command for bare Ubuntu: install + config + daemon.
     */
    protected function buildFullInstallCommand(Server $server): string
    {
        $parts = [
            'curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard',
            'mkdir -p /root/.openclaw && test -f /root/.openclaw/openclaw.json || echo "{}" > /root/.openclaw/openclaw.json',
            '. ~/.profile && . ~/.bashrc',
            'openclaw config set gateway.mode local',
            'openclaw plugins enable telegram',
            'openclaw config set channels.telegram.enabled true',
            'openclaw config set channels.telegram.botToken ' . escapeshellarg($this->telegramToken),
            "openclaw config set channels.telegram.allowFrom '[\"*\"]'",
            "openclaw config set channels.telegram.dmPolicy '\"open\"'",
            "openclaw config set channels.telegram.groups '{\"*\":{\"requireMention\":true}}'",
        ];

        $parts = array_merge($parts, $this->getLlmConfigParts($server));

        $parts[] = 'loginctl enable-linger root';
        $parts[] = 'openclaw daemon install';
        $parts[] = 'openclaw daemon start';
        $parts[] = 'sleep 1 && openclaw daemon status';

        return implode(' && ', $parts);
    }

    /**
     * LLM config command parts (no profile loading — already done in batch).
     */
    protected function getLlmConfigParts(Server $server): array
    {
        $parts = [];
        $user = $server->user;

        if ($user && $user->llm_billing_mode === 'byok') {
            if ($user->anthropic_api_key) {
                $parts[] = 'openclaw config set env.ANTHROPIC_API_KEY ' . escapeshellarg($user->anthropic_api_key);
                $parts[] = 'openclaw config set agents.defaults.model.primary anthropic/claude-opus-4-6';
            } elseif ($user->openai_api_key) {
                $parts[] = 'openclaw config set env.OPENAI_API_KEY ' . escapeshellarg($user->openai_api_key);
                $parts[] = 'openclaw config set agents.defaults.model.primary openai/gpt-4o';
            }
        } else {
            $platformKey = config('services.anthropic.api_key');
            if ($platformKey) {
                $parts[] = 'openclaw config set env.ANTHROPIC_API_KEY ' . escapeshellarg($platformKey);
                $parts[] = 'openclaw config set agents.defaults.model.primary anthropic/claude-opus-4-6';
            }
        }

        return $parts;
    }

    protected function isSnapshotDeploy(): bool
    {
        return !empty(config('services.hetzner.snapshot_id'));
    }
}
