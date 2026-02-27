<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class TelegramBotCreatorService
{
    /**
     * BotFather's Telegram provider ID.
     * Numeric user ID: 93372553
     */
    protected const BOTFATHER_ID = '93372553';

    protected UnipileService $unipile;
    protected string $accountId;

    public function __construct(UnipileService $unipile)
    {
        $this->unipile = $unipile;
        $this->accountId = config('services.unipile.telegram_account_id') ?? '';
    }

    /**
     * Create a new Telegram bot via BotFather.
     *
     * @param string $botName     Display name for the bot (e.g. "My Cool Bot")
     * @param string $botUsername  Username for the bot, must end in "bot" (e.g. "my_cool_bot")
     * @param int    $pollDelay   Seconds to wait between polling for BotFather responses
     * @param int    $maxAttempts Max polling attempts per step
     * @return array{success: bool, token?: string, error?: string, chat_id?: string}
     */
    public function createBot(
        string $botName,
        string $botUsername,
        int $pollDelay = 3,
        int $maxAttempts = 20,
        ?callable $onLog = null
    ): array {
        $log = $onLog ?? function (string $msg) {};

        // Step 1: Send /newbot to BotFather
        $log('Sending /newbot to BotFather...');
        $chatResponse = $this->unipile->startNewChat(
            $this->accountId,
            self::BOTFATHER_ID,
            '/newbot'
        );

        $chatId = $chatResponse['chat_id'] ?? $chatResponse['id'] ?? null;
        if (! $chatId) {
            return ['success' => false, 'error' => 'Failed to start chat with BotFather. Response: ' . json_encode($chatResponse)];
        }

        $log("Chat started with BotFather (chat_id: {$chatId})");

        // Step 2: Wait for BotFather to ask for bot name
        $log('Waiting for BotFather to ask for bot name...');
        $response = $this->waitForBotFatherReply($chatId, $pollDelay, $maxAttempts, $log);
        if (! $response) {
            return ['success' => false, 'error' => 'Timed out waiting for BotFather response after /newbot', 'chat_id' => $chatId];
        }

        // Step 3: Send the bot name
        $log("Sending bot name: {$botName}");
        $this->unipile->sendMessage($chatId, $botName);

        // Step 4: Wait for BotFather to ask for username
        $log('Waiting for BotFather to ask for bot username...');
        sleep($pollDelay);
        $response = $this->waitForBotFatherReply($chatId, $pollDelay, $maxAttempts, $log, 'username');
        if (! $response) {
            return ['success' => false, 'error' => 'Timed out waiting for BotFather username prompt', 'chat_id' => $chatId];
        }

        // Step 5: Send the bot username
        $log("Sending bot username: {$botUsername}");
        $this->unipile->sendMessage($chatId, $botUsername);

        // Step 6: Wait for the token response
        $log('Waiting for BotFather to return the bot token...');
        sleep($pollDelay);
        $tokenResponse = $this->waitForBotFatherReply($chatId, $pollDelay, $maxAttempts, $log, 'token');
        if (! $tokenResponse) {
            return ['success' => false, 'error' => 'Timed out waiting for bot token from BotFather', 'chat_id' => $chatId];
        }

        // Step 7: Extract the token
        $token = $this->extractToken($tokenResponse);
        if (! $token) {
            return [
                'success' => false,
                'error' => 'Could not extract token from BotFather response',
                'chat_id' => $chatId,
                'raw_response' => $tokenResponse,
            ];
        }

        $log("Bot created successfully! Token: {$token}");

        return [
            'success' => true,
            'token' => $token,
            'chat_id' => $chatId,
            'bot_username' => $botUsername,
        ];
    }

    /**
     * Poll for a new BotFather reply in the chat.
     */
    protected function waitForBotFatherReply(
        string $chatId,
        int $pollDelay,
        int $maxAttempts,
        callable $log,
        ?string $expectKeyword = null
    ): ?string {
        $lastSeenMessageId = null;

        for ($i = 0; $i < $maxAttempts; $i++) {
            sleep($pollDelay);

            $messages = $this->unipile->getMessages($chatId, 5);
            $items = $messages['items'] ?? $messages['data'] ?? $messages;

            if (! is_array($items) || empty($items)) {
                $log("  Polling attempt " . ($i + 1) . "/{$maxAttempts} - no messages yet");
                continue;
            }

            // Look for the most recent message NOT from us (is_sender = false)
            foreach ($items as $msg) {
                $isSender = $msg['is_sender'] ?? true;
                $text = $msg['text'] ?? '';
                $msgId = $msg['id'] ?? null;

                if ($isSender || empty($text)) {
                    continue;
                }

                // Skip if we've already seen this message
                if ($msgId && $msgId === $lastSeenMessageId) {
                    continue;
                }

                // If we're looking for a specific keyword, check for it
                if ($expectKeyword) {
                    $textLower = strtolower($text);
                    $matches = match ($expectKeyword) {
                        'username' => str_contains($textLower, 'username'),
                        'token' => preg_match('/\d+:[A-Za-z0-9_-]{30,}/', $text),
                        default => true,
                    };

                    if ($matches) {
                        $log("  Got expected response from BotFather");
                        return $text;
                    }
                } else {
                    $log("  Got response from BotFather");
                    return $text;
                }
            }

            $log("  Polling attempt " . ($i + 1) . "/{$maxAttempts} - waiting...");
        }

        return null;
    }

    /**
     * Extract the bot token from BotFather's response text.
     * Token format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
     */
    protected function extractToken(string $text): ?string
    {
        if (preg_match('/(\d+:[A-Za-z0-9_-]{30,})/', $text, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
