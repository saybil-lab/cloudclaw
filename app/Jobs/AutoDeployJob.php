<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\DockerDeploymentService;
use App\Services\TelegramBotCreatorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AutoDeployJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 180;
    public int $tries = 2;

    public function __construct(
        protected int $userId
    ) {}

    public function handle(
        TelegramBotCreatorService $botCreator,
        DockerDeploymentService $dockerService
    ): void {
        $user = User::find($this->userId);
        if (!$user) {
            Log::error('AutoDeployJob: User not found', ['user_id' => $this->userId]);
            return;
        }

        // Skip if user already has an active (non-deleted) server
        $existing = $user->servers()->whereNotIn('status', ['deleted'])->first();
        if ($existing) {
            Log::info('AutoDeployJob: User already has an active server, skipping', [
                'user_id' => $user->id,
                'server_id' => $existing->id,
            ]);
            return;
        }

        // Generate bot name from user's name + random suffix
        $baseName = Str::slug($user->name ?: 'assistant');
        $suffix = strtolower(Str::random(4));
        $botName = ucfirst($baseName) . ' Assistant';
        $botUsername = Str::replace('-', '_', $baseName) . '_' . $suffix . '_bot';

        Log::info('AutoDeployJob: Starting bot creation', [
            'user_id' => $user->id,
            'bot_username' => $botUsername,
        ]);

        try {
            // Dev shortcut: reuse a single bot token to avoid BotFather rate limits
            $devToken = env('DEV_TELEGRAM_TOKEN');
            $devBotUsername = env('DEV_TELEGRAM_BOT_USERNAME');

            if ($devToken && $devBotUsername) {
                Log::info('AutoDeployJob: Using dev Telegram token', ['user_id' => $user->id]);
                $token = $devToken;
                $botUsername = $devBotUsername;
            } else {
                // Step 1: Create Telegram bot via BotFather
                $result = $botCreator->createBot(
                    $botName,
                    $botUsername,
                    onLog: fn(string $msg) => Log::debug("AutoDeployJob [{$user->id}]: {$msg}")
                );

                if (!$result['success']) {
                    Log::error('AutoDeployJob: Bot creation failed', [
                        'user_id' => $user->id,
                        'error' => $result['error'] ?? 'Unknown error',
                    ]);
                    return;
                }

                $token = $result['token'];
                $botUsername = $result['bot_username'] ?? $botUsername;
            }

            Log::info('AutoDeployJob: Bot ready, deploying container', [
                'user_id' => $user->id,
                'bot_username' => $botUsername,
            ]);

            // Step 2: Deploy Docker container
            $server = $dockerService->deploy(
                $user,
                $token,
                name: 'openclaw-' . $baseName . '-' . $suffix,
                skipChecks: true
            );

            // Step 3: Set bot_username on server
            $server->update(['bot_username' => $botUsername]);

            Log::info('AutoDeployJob: Deployment complete', [
                'user_id' => $user->id,
                'server_id' => $server->id,
                'bot_username' => $botUsername,
            ]);

        } catch (\Exception $e) {
            Log::error('AutoDeployJob: Deployment failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            // If a server was created but deployment failed, mark it as error
            $server = $user->servers()->whereNotIn('status', ['deleted', 'running'])->latest()->first();
            if ($server) {
                $server->update(['status' => 'error', 'provision_status' => 'failed']);
                $server->appendProvisionLog('Auto-deploy failed: ' . $e->getMessage());
            }
        }
    }
}
