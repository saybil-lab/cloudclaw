<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UnipileService
{
    protected string $apiKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.unipile.api_key') ?? '';
        $this->baseUrl = rtrim(config('services.unipile.dsn') ?? '', '/') . '/api/v1';
    }

    protected function request(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withHeaders([
            'X-API-KEY' => $this->apiKey,
        ])
            ->baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(30);
    }

    /**
     * Send a message in an existing chat.
     */
    public function sendMessage(string $chatId, string $text): array
    {
        $response = $this->request()
            ->asMultipart()
            ->post("/chats/{$chatId}/messages", [
                ['name' => 'text', 'contents' => $text],
            ]);

        if ($response->failed()) {
            Log::error('Unipile: Failed to send message', [
                'chat_id' => $chatId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $response->json() ?? [];
    }

    /**
     * Start a new chat or send a message to a user by their provider ID.
     */
    public function startNewChat(string $accountId, string $attendeeId, string $text): array
    {
        $response = $this->request()
            ->asMultipart()
            ->post('/chats', [
                ['name' => 'account_id', 'contents' => $accountId],
                ['name' => 'text', 'contents' => $text],
                ['name' => 'attendees_ids', 'contents' => $attendeeId],
            ]);

        if ($response->failed()) {
            Log::error('Unipile: Failed to start new chat', [
                'account_id' => $accountId,
                'attendee_id' => $attendeeId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $response->json() ?? [];
    }

    /**
     * Get messages from a chat, ordered by most recent first.
     */
    public function getMessages(string $chatId, int $limit = 10): array
    {
        $response = $this->request()
            ->get("/chats/{$chatId}/messages", [
                'limit' => $limit,
            ]);

        if ($response->failed()) {
            Log::error('Unipile: Failed to get messages', [
                'chat_id' => $chatId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $response->json() ?? [];
    }

    /**
     * List all chats for an account.
     */
    public function getChats(string $accountId): array
    {
        $response = $this->request()
            ->get('/chats', [
                'account_id' => $accountId,
            ]);

        return $response->json() ?? [];
    }
}
