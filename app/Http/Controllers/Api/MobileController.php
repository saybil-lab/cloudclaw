<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Models\User;
use App\Services\CreditService;
use App\Services\HetznerDeploymentService;
use App\Services\RevenueCatService;
use App\Services\TelegramBotCreatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MobileController extends Controller
{
    public function __construct(
        protected RevenueCatService $revenueCat,
        protected CreditService $creditService,
        protected HetznerDeploymentService $deploymentService,
        protected TelegramBotCreatorService $botCreator,
    ) {}

    /**
     * Subscription tier credit amounts.
     */
    protected const TIER_CREDITS = [
        'starter' => 14.00,   // ~1400 credits at $0.01/credit
        'pro' => 42.00,       // ~4200 credits
        'beast' => 112.00,    // ~11200 credits
    ];

    /**
     * Map RevenueCat product/entitlement IDs to tiers.
     */
    protected const PRODUCT_TIER_MAP = [
        'cloudclaw_starter' => 'starter',
        'cloudclaw_pro' => 'pro',
        'cloudclaw_beast' => 'beast',
        // Entitlement IDs
        'starter' => 'starter',
        'pro' => 'pro',
        'beast' => 'beast',
    ];

    /**
     * Handle RevenueCat webhook events.
     * POST /api/webhooks/revenuecat
     */
    public function handleRevenueCatWebhook(Request $request): JsonResponse
    {
        $authKey = config('services.revenuecat.webhook_auth_key');

        if ($authKey && $request->bearerToken() !== $authKey) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $event = $request->input('event', []);
        $type = $event['type'] ?? null;
        $appUserId = $event['app_user_id'] ?? null;
        $productId = $event['product_id'] ?? null;
        $entitlementId = $event['entitlement_id'] ?? null;

        if (!$type || !$appUserId) {
            return response()->json(['error' => 'Invalid event payload'], 422);
        }

        Log::info('RevenueCat webhook received', [
            'type' => $type,
            'app_user_id' => $appUserId,
            'product_id' => $productId,
            'entitlement_id' => $entitlementId,
        ]);

        // Invalidate cache so fresh data is fetched next time
        $this->revenueCat->invalidateCache($appUserId);

        // Find user by RC ID or Apple user ID
        $user = User::where('revenuecat_user_id', $appUserId)
            ->orWhere('apple_user_id', $appUserId)
            ->first();

        if (!$user) {
            $user = User::create([
                'name' => 'Mobile User',
                'email' => $appUserId . '@mobile.cloudclaw.com',
                'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(32)),
                'revenuecat_user_id' => $appUserId,
                'platform' => 'ios',
                'llm_billing_mode' => 'credits',
                'llm_credits' => 10.00,
                'received_welcome_bonus' => true,
            ]);

            \App\Models\CreditTransaction::create([
                'user_id' => $user->id,
                'type' => 'bonus',
                'amount' => 10.00,
                'balance_after' => 10.00,
                'description' => 'Welcome bonus (new account)',
            ]);
        }

        // Link RC user ID if not set
        if (!$user->revenuecat_user_id) {
            $user->update(['revenuecat_user_id' => $appUserId]);
        }

        // Determine tier from product or entitlement ID
        $tier = self::PRODUCT_TIER_MAP[$productId] ?? self::PRODUCT_TIER_MAP[$entitlementId] ?? null;

        match ($type) {
            'INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION' => $this->handleActivation($user, $type, $tier),
            'CANCELLATION' => $user->update(['subscription_status' => 'canceled']),
            'EXPIRATION', 'BILLING_ISSUE' => $user->update(['subscription_status' => 'expired', 'subscription_tier' => null]),
            default => Log::info('Unhandled RevenueCat event type', ['type' => $type]),
        };

        return response()->json(['ok' => true]);
    }

    protected function handleActivation(User $user, string $eventType, ?string $tier): void
    {
        $updates = ['subscription_status' => 'active'];
        if ($tier) {
            $updates['subscription_tier'] = $tier;
        }
        $user->update($updates);

        $creditAmount = self::TIER_CREDITS[$tier ?? 'starter'] ?? self::TIER_CREDITS['starter'];

        // Grant credits on initial purchase
        if ($eventType === 'INITIAL_PURCHASE') {
            $user->increment('llm_credits', $creditAmount);

            \App\Models\CreditTransaction::create([
                'user_id' => $user->id,
                'type' => 'bonus',
                'amount' => $creditAmount,
                'balance_after' => (float) $user->fresh()->llm_credits,
                'description' => ucfirst($tier ?? 'starter') . ' subscription credits',
            ]);
        }

        // Grant monthly credits on renewals
        if ($eventType === 'RENEWAL') {
            $user->increment('llm_credits', $creditAmount);

            \App\Models\CreditTransaction::create([
                'user_id' => $user->id,
                'type' => 'renewal',
                'amount' => $creditAmount,
                'balance_after' => (float) $user->fresh()->llm_credits,
                'description' => ucfirst($tier ?? 'starter') . ' monthly renewal',
            ]);
        }
    }

    /**
     * Get current user state.
     * GET /api/user
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        $server = $user->servers()->where('status', '!=', 'deleted')->latest()->first();

        $credits = (float) $user->llm_credits;

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'has_consented' => (bool) $user->has_consented,
            'subscription_status' => $user->subscription_status,
            'subscription_tier' => $user->subscription_tier,
            'llm_credits' => $credits,
            'credits_low' => $credits > 0 && $credits <= 1.00,
            'credits_depleted' => $credits <= 0,
            'has_server' => (bool) $server,
            'server' => $server ? $this->formatServer($server) : null,
            'llm_billing_mode' => $user->llm_billing_mode ?? 'credits',
            'has_anthropic_key' => !empty($user->anthropic_api_key),
        ]);
    }

    /**
     * Deploy OpenClaw with a new Telegram bot.
     * POST /api/deploy
     * Bot name is optional — auto-generated if not provided.
     */
    public function deploy(Request $request): JsonResponse
    {
        $request->validate([
            'bot_name' => 'nullable|string|min:3|max:64',
        ]);

        $user = $request->user();

        // Free users can deploy if they have credits (10 given on signup)
        if ($user->isLlmCreditsMode() && (float) $user->llm_credits <= 0) {
            return response()->json(['error' => 'You need AI credits to deploy. Please top up your credits.'], 402);
        }

        if ($user->isLlmByokMode() && empty($user->anthropic_api_key)) {
            return response()->json(['error' => 'Please add your API key first.'], 422);
        }

        // One server per mobile user — use DB lock to prevent race conditions
        $existingServer = DB::transaction(function () use ($user) {
            return $user->servers()
                ->where('status', '!=', 'deleted')
                ->lockForUpdate()
                ->first();
        });

        if ($existingServer) {
            return response()->json([
                'error' => 'You already have an active server',
                'server' => $this->formatServer($existingServer),
            ], 409);
        }

        $botName = $request->input('bot_name', 'CloudClaw Assistant');

        // Generate bot username: lowercase → replace non-alnum with _ → truncate → append suffix
        $botUsername = strtolower($botName);
        $botUsername = preg_replace('/[^a-z0-9]/', '_', $botUsername);
        $botUsername = preg_replace('/_+/', '_', $botUsername); // collapse multiple underscores
        $botUsername = trim($botUsername, '_');
        $botUsername = substr($botUsername, 0, 20);
        $botUsername .= '_' . rand(1000, 9999) . '_bot';

        // Create bot via BotFather (synchronous, ~30-60s)
        Log::info('Creating Telegram bot', ['bot_name' => $botName, 'bot_username' => $botUsername, 'user_id' => $user->id]);

        $botResult = $this->botCreator->createBot(
            botName: $botName,
            botUsername: $botUsername,
            onLog: fn (string $msg) => Log::info("BotCreator: {$msg}"),
        );

        if (!$botResult['success']) {
            Log::error('Bot creation failed', ['error' => $botResult['error'] ?? 'Unknown', 'user_id' => $user->id]);
            return response()->json(['error' => 'Failed to create Telegram bot: ' . ($botResult['error'] ?? 'Unknown error')], 500);
        }

        $telegramToken = $botResult['token'];

        // Default to credits mode if not already set
        if (!$user->llm_billing_mode) {
            $user->update(['llm_billing_mode' => 'credits']);
        }

        // Deploy server (async install via job)
        $server = $this->deploymentService->deployOpenClaw($user, $telegramToken);
        $server->update(['bot_username' => $botUsername, 'name' => $botName]);

        return response()->json([
            'status' => 'deploying',
            'server_id' => $server->id,
            'bot_username' => $botUsername,
        ]);
    }

    /**
     * Poll deployment progress.
     * GET /api/deploy/status
     */
    public function deployStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $server = $user->servers()->where('status', '!=', 'deleted')->latest()->first();

        if (!$server) {
            return response()->json(['error' => 'No server found'], 404);
        }

        return response()->json($this->formatServer($server));
    }

    /**
     * Delete user's server.
     * DELETE /api/server
     */
    public function deleteServer(Request $request): JsonResponse
    {
        $user = $request->user();
        $server = $user->servers()->where('status', '!=', 'deleted')->latest()->first();

        if (!$server) {
            return response()->json(['error' => 'No server found'], 404);
        }

        $this->deploymentService->deleteServer($server);

        return response()->json(['ok' => true]);
    }

    /**
     * Update LLM billing mode (credits or byok).
     * POST /api/billing-mode
     */
    public function updateBillingMode(Request $request): JsonResponse
    {
        $request->validate([
            'mode' => 'required|in:credits,byok',
        ]);

        $user = $request->user();
        $mode = $request->input('mode');

        if ($mode === 'byok' && empty($user->anthropic_api_key)) {
            return response()->json(['error' => 'Please add your API key first'], 422);
        }

        $user->update(['llm_billing_mode' => $mode]);

        // Sync the key to running servers when switching to BYOK
        if ($mode === 'byok') {
            $this->syncApiKeyToServers($user, 'anthropic', $user->anthropic_api_key);
        } else {
            // Switch back to platform key
            $platformKey = config('services.anthropic.api_key');
            if ($platformKey) {
                $this->syncApiKeyToServers($user, 'anthropic', $platformKey);
            }
        }

        return response()->json(['ok' => true, 'mode' => $mode]);
    }

    /**
     * Save or update the user's Anthropic API key.
     * POST /api/api-key
     */
    public function updateApiKey(Request $request): JsonResponse
    {
        $request->validate([
            'api_key' => 'required|string|min:10',
        ]);

        $user = $request->user();
        $apiKey = $request->input('api_key');

        // Validate the key against Anthropic API
        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $apiKey,
                'anthropic-version' => '2023-06-01',
            ])->get('https://api.anthropic.com/v1/models');

            if (!$response->successful()) {
                return response()->json(['error' => 'Invalid API key'], 422);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Could not validate API key'], 422);
        }

        $user->update(['anthropic_api_key' => $apiKey]);

        // If in BYOK mode, sync to running servers
        if ($user->isLlmByokMode()) {
            $this->syncApiKeyToServers($user, 'anthropic', $apiKey);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Remove the user's API key and switch back to credits mode.
     * DELETE /api/api-key
     */
    public function removeApiKey(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->update([
            'anthropic_api_key' => null,
            'llm_billing_mode' => 'credits',
        ]);

        // Sync platform key back to running servers
        $platformKey = config('services.anthropic.api_key');
        if ($platformKey) {
            $this->syncApiKeyToServers($user, 'anthropic', $platformKey);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * DEV ONLY: Simulate an INITIAL_PURCHASE event to grant $5 welcome credits.
     * POST /api/dev/simulate-purchase
     */
    public function devSimulatePurchase(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->update(['subscription_status' => 'active']);

        if (!$user->received_welcome_bonus) {
            $user->increment('llm_credits', 10.00);

            \App\Models\CreditTransaction::create([
                'user_id' => $user->id,
                'type' => 'bonus',
                'amount' => 10.00,
                'balance_after' => (float) $user->fresh()->llm_credits,
                'description' => 'Welcome bonus (simulated purchase)',
            ]);

            $user->update(['received_welcome_bonus' => true]);
        }

        return response()->json([
            'ok' => true,
            'llm_credits' => (float) $user->fresh()->llm_credits,
        ]);
    }

    protected function syncApiKeyToServers(User $user, string $provider, string $apiKey): void
    {
        $servers = $user->servers()->where('status', 'running')->get();
        foreach ($servers as $server) {
            \App\Jobs\SyncLlmKeyJob::dispatch($server, $provider, $apiKey);
        }
    }

    protected function formatServer(Server $server): array
    {
        $isReady = $server->isReady();

        return [
            'id' => $server->id,
            'name' => $server->name,
            'status' => $server->status,
            'provision_status' => $server->provision_status,
            'bot_username' => $server->bot_username,
            'telegram_url' => $server->bot_username ? "https://t.me/{$server->bot_username}" : null,
            'is_ready' => $isReady,
        ];
    }
}
