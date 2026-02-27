<?php

namespace App\Console\Commands;

use App\Models\Server;
use App\Services\DockerDeploymentService;
use App\Services\SshService;
use App\Services\TelegramBotCreatorService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class TestDockerLiveCommand extends Command
{
    protected $signature = 'docker:test-live
        {--telegram-token= : Reuse an existing Telegram bot token}
        {--bot-name= : Display name for the new bot (default: CloudClaw Test)}
        {--bot-username= : Username for the new bot (must end in "bot")}
        {--cleanup : Remove the container when done}
        {--redeploy : Remove existing test container and deploy fresh}';

    protected $description = 'Deploy a real OpenClaw container with a live Telegram bot and Claude API key';

    protected function getStoragePath(): string
    {
        return storage_path('app/docker_test.json');
    }

    protected function loadState(): array
    {
        $path = $this->getStoragePath();
        if (file_exists($path)) {
            return json_decode(file_get_contents($path), true) ?: [];
        }
        return [];
    }

    protected function saveState(array $state): void
    {
        file_put_contents($this->getStoragePath(), json_encode($state, JSON_PRETTY_PRINT));
    }

    public function handle(DockerDeploymentService $dockerService, SshService $sshService): int
    {
        $state = $this->loadState();
        $anthropicKey = config('services.anthropic.api_key');

        if (!$anthropicKey) {
            $this->error('ANTHROPIC_API_KEY is not set in .env');
            return self::FAILURE;
        }

        $hostIp = config('services.docker.host_ip');
        if (!$hostIp) {
            $this->error('DOCKER_HOST_IP is not set. Run: php artisan docker:setup-host');
            return self::FAILURE;
        }

        // Handle --redeploy: clean up existing container first
        if ($this->option('redeploy') && !empty($state['server_id'])) {
            $this->cleanupExisting($dockerService, $state);
            unset($state['server_id'], $state['container_name']);
            $this->saveState($state);
        }

        // Check if there's already a running test container
        if (!empty($state['server_id']) && !$this->option('cleanup')) {
            $server = Server::find($state['server_id']);
            if ($server && $server->status === 'running') {
                $this->info('Existing test container is running:');
                $this->line("  Container: {$server->container_name}");
                $this->line("  Bot: @{$state['bot_username']}");
                $this->line("  Server ID: {$server->id}");
                $this->newLine();

                $this->info('Checking daemon status...');
                $result = $sshService->execute($server, 'openclaw daemon status 2>&1 | head -5');
                $this->line('  ' . str_replace("\n", "\n  ", trim($result['stdout'])));

                if ($this->option('cleanup') || $this->confirm('Remove this container?', false)) {
                    $this->cleanupExisting($dockerService, $state);
                    $state = [];
                    $this->saveState($state);
                } else {
                    $this->newLine();
                    $this->info('Use --redeploy to replace it, or --cleanup to remove.');
                }
                return self::SUCCESS;
            }
        }

        // Step 1: Get or create Telegram bot token
        $telegramToken = $this->option('telegram-token') ?: ($state['telegram_token'] ?? null);
        $botUsername = $state['bot_username'] ?? null;

        if (!$telegramToken) {
            $this->info('[1/3] Creating Telegram bot via BotFather...');

            $botName = $this->option('bot-name') ?: 'CloudClaw Test';
            $botUsername = $this->option('bot-username') ?: 'cloudclaw_test_' . Str::random(5) . '_bot';

            $botCreator = app(TelegramBotCreatorService::class);
            $result = $botCreator->createBot($botName, $botUsername, onLog: function (string $msg) {
                $this->line("  {$msg}");
            });

            if (!$result['success']) {
                $this->error('Failed to create bot: ' . ($result['error'] ?? 'Unknown error'));
                $this->newLine();
                $this->info('You can create one manually via @BotFather and pass it with --telegram-token=TOKEN');
                return self::FAILURE;
            }

            $telegramToken = $result['token'];
            $botUsername = $result['bot_username'] ?? $botUsername;

            $this->info("Bot created: @{$botUsername}");

            // Store for reuse
            $state['telegram_token'] = $telegramToken;
            $state['bot_username'] = $botUsername;
            $this->saveState($state);
        } else {
            $this->info('[1/3] Using stored Telegram bot token');
            if ($botUsername) {
                $this->line("  Bot: @{$botUsername}");
            }
        }

        // Step 2: Deploy container
        $this->info('[2/3] Deploying Docker container...');
        $totalStart = microtime(true);

        $user = \App\Models\User::first();
        if (!$user) {
            $this->error('No users in database.');
            return self::FAILURE;
        }

        try {
            $server = $dockerService->deploy(
                $user,
                $telegramToken,
                'live-test-' . Str::random(6),
                skipChecks: true
            );
        } catch (\Exception $e) {
            $this->error('Deploy failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        $deployTime = microtime(true) - $totalStart;
        $this->line(sprintf('  Container: %s (%.1fs)', $server->container_name, $deployTime));

        // Store server info
        $state['server_id'] = $server->id;
        $state['container_name'] = $server->container_name;
        $this->saveState($state);

        // Step 3: Verify gateway is running
        $this->info('[3/3] Verifying gateway...');
        sleep(2);

        $result = $sshService->execute($server, 'openclaw status 2>&1 | head -10');
        $this->line('  ' . str_replace("\n", "\n  ", trim($result['stdout'])));

        $this->newLine();
        $this->info('Live test deployed!');
        $this->line("  Bot: @{$botUsername} — send it a message on Telegram");
        $this->line("  Container: {$server->container_name}");
        $this->line(sprintf('  Deploy time: %.1fs', $deployTime));
        $this->newLine();
        $this->info('Run again with --cleanup to remove, or --redeploy to replace.');

        return self::SUCCESS;
    }

    protected function cleanupExisting(DockerDeploymentService $dockerService, array $state): void
    {
        $server = Server::find($state['server_id'] ?? 0);
        if ($server) {
            $this->info('Removing existing test container...');
            $dockerService->deleteContainer($server);
            $server->delete();
            $this->info('Removed.');
        }
    }
}
