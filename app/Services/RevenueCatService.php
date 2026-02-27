<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RevenueCatService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://api.revenuecat.com';

    public function __construct()
    {
        $this->apiKey = config('services.revenuecat.api_key') ?? '';
    }

    public function getSubscriber(string $appUserId): ?array
    {
        $cacheKey = "revenuecat:subscriber:{$appUserId}";

        return Cache::remember($cacheKey, 300, function () use ($appUserId) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->get("{$this->baseUrl}/v1/subscribers/{$appUserId}");

            if ($response->failed()) {
                Log::warning('RevenueCat API error', [
                    'app_user_id' => $appUserId,
                    'status' => $response->status(),
                ]);
                return null;
            }

            return $response->json('subscriber');
        });
    }

    public function hasActiveEntitlement(string $appUserId, string $entitlementId = 'pro'): bool
    {
        $subscriber = $this->getSubscriber($appUserId);

        if (!$subscriber) {
            return false;
        }

        $entitlement = $subscriber['entitlements'][$entitlementId] ?? null;

        if (!$entitlement) {
            return false;
        }

        $expiresDate = $entitlement['expires_date'] ?? null;

        if (!$expiresDate) {
            return true; // Lifetime entitlement
        }

        return now()->lt($expiresDate);
    }

    public function invalidateCache(string $appUserId): void
    {
        Cache::forget("revenuecat:subscriber:{$appUserId}");
    }
}
