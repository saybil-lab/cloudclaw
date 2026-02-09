<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MailService
{
    protected string $apiUrl;
    protected string $apiKey;
    protected string $domain;

    public function __construct()
    {
        $this->apiUrl = rtrim(config('services.mailcow.url', ''), '/');
        $this->apiKey = config('services.mailcow.api_key', '');
        $this->domain = config('services.mailcow.domain', 'ai.cloudclaw.com');
    }

    /**
     * Check if Mailcow is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiUrl) && !empty($this->apiKey);
    }

    /**
     * Make API request to Mailcow
     */
    protected function request(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::baseUrl($this->apiUrl)
            ->withHeaders([
                'X-API-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->acceptJson()
            ->timeout(30);
    }

    /**
     * Create a new mailbox
     */
    public function createMailbox(string $username, string $password, ?string $name = null): ?array
    {
        if (!$this->isConfigured()) {
            Log::warning('MailService: Mailcow not configured, skipping mailbox creation');
            return null;
        }

        // Sanitize username
        $username = Str::slug($username, '');
        $email = "{$username}@{$this->domain}";
        $name = $name ?? "CloudClaw Server {$username}";

        try {
            $response = $this->request()->post('/api/v1/add/mailbox', [
                'local_part' => $username,
                'domain' => $this->domain,
                'name' => $name,
                'password' => $password,
                'password2' => $password,
                'quota' => 1024, // 1GB quota
                'active' => 1,
                'force_pw_update' => 0,
                'tls_enforce_in' => 1,
                'tls_enforce_out' => 1,
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                // Check for success response
                if (isset($result[0]) && $result[0]['type'] === 'success') {
                    Log::info('Mailbox created', ['email' => $email]);
                    return [
                        'email' => $email,
                        'username' => $username,
                        'domain' => $this->domain,
                    ];
                }

                // Check for error
                if (isset($result[0]) && $result[0]['type'] === 'error') {
                    Log::error('Mailcow API error', ['response' => $result]);
                    throw new \Exception($result[0]['msg'] ?? 'Unknown Mailcow error');
                }
            }

            Log::error('Failed to create mailbox', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            
            return null;

        } catch (\Exception $e) {
            Log::error('MailService error creating mailbox', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete a mailbox
     */
    public function deleteMailbox(string $email): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $response = $this->request()->post('/api/v1/delete/mailbox', [
                [$email],
            ]);

            if ($response->successful()) {
                Log::info('Mailbox deleted', ['email' => $email]);
                return true;
            }

            Log::warning('Failed to delete mailbox', [
                'email' => $email,
                'response' => $response->json(),
            ]);
            
            return false;

        } catch (\Exception $e) {
            Log::error('MailService error deleting mailbox', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get mailbox details
     */
    public function getMailbox(string $email): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = $this->request()->get("/api/v1/get/mailbox/{$email}");

            if ($response->successful()) {
                return $response->json();
            }

            return null;

        } catch (\Exception $e) {
            Log::error('MailService error getting mailbox', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Update mailbox password
     */
    public function updatePassword(string $email, string $newPassword): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $response = $this->request()->post('/api/v1/edit/mailbox', [
                'items' => [$email],
                'attr' => [
                    'password' => $newPassword,
                    'password2' => $newPassword,
                ],
            ]);

            if ($response->successful()) {
                Log::info('Mailbox password updated', ['email' => $email]);
                return true;
            }

            return false;

        } catch (\Exception $e) {
            Log::error('MailService error updating password', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * List all mailboxes for the domain
     */
    public function listMailboxes(): array
    {
        if (!$this->isConfigured()) {
            return [];
        }

        try {
            $response = $this->request()->get("/api/v1/get/mailbox/all");

            if ($response->successful()) {
                $mailboxes = $response->json();
                
                // Filter by our domain
                return array_filter($mailboxes, function ($mailbox) {
                    return ($mailbox['domain'] ?? '') === $this->domain;
                });
            }

            return [];

        } catch (\Exception $e) {
            Log::error('MailService error listing mailboxes', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Get domain info
     */
    public function getDomainInfo(): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = $this->request()->get("/api/v1/get/domain/{$this->domain}");

            if ($response->successful()) {
                return $response->json();
            }

            return null;

        } catch (\Exception $e) {
            Log::error('MailService error getting domain info', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
