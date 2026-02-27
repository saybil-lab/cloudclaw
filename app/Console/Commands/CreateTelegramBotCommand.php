<?php

namespace App\Console\Commands;

use App\Services\TelegramBotCreatorService;
use Illuminate\Console\Command;

class CreateTelegramBotCommand extends Command
{
    protected $signature = 'telegram:create-bot
                            {name : Display name for the bot}
                            {username : Username for the bot (must end in "bot")}
                            {--poll-delay=3 : Seconds between polling attempts}
                            {--max-attempts=20 : Max polling attempts per step}';

    protected $description = 'Create a new Telegram bot via BotFather using Unipile API';

    public function handle(TelegramBotCreatorService $service): int
    {
        $name = $this->argument('name');
        $username = $this->argument('username');
        $pollDelay = (int) $this->option('poll-delay');
        $maxAttempts = (int) $this->option('max-attempts');

        if (! str_ends_with(strtolower($username), 'bot')) {
            $this->error('Bot username must end with "bot" (e.g. my_cool_bot)');
            return self::FAILURE;
        }

        $this->info("Creating Telegram bot: {$name} (@{$username})");
        $this->newLine();

        $result = $service->createBot(
            $name,
            $username,
            $pollDelay,
            $maxAttempts,
            fn (string $msg) => $this->line("  {$msg}")
        );

        $this->newLine();

        if ($result['success']) {
            $this->info('Bot created successfully!');
            $this->newLine();
            $this->table(
                ['Field', 'Value'],
                [
                    ['Bot Username', '@' . $result['bot_username']],
                    ['Bot Token', $result['token']],
                    ['Chat ID', $result['chat_id'] ?? 'N/A'],
                ]
            );

            return self::SUCCESS;
        }

        $this->error('Failed to create bot: ' . ($result['error'] ?? 'Unknown error'));
        if (isset($result['raw_response'])) {
            $this->newLine();
            $this->warn('Raw BotFather response:');
            $this->line($result['raw_response']);
        }

        return self::FAILURE;
    }
}
