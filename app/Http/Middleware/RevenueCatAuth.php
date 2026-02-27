<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\RevenueCatService;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class RevenueCatAuth
{
    public function __construct(protected RevenueCatService $revenueCat) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Try Bearer token auth first (Sanctum — from Apple Sign In)
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            $accessToken = PersonalAccessToken::findToken($bearerToken);
            if ($accessToken) {
                $user = $accessToken->tokenable;
                if ($user instanceof User) {
                    $request->setUserResolver(fn () => $user);
                    return $next($request);
                }
            }
        }

        // Fall back to RevenueCat user ID header (legacy flow)
        $rcUserId = $request->header('X-RevenueCat-User-Id');

        if (!$rcUserId) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $user = User::where('revenuecat_user_id', $rcUserId)->first();

        if (!$user) {
            $isLocalEnv = app()->environment('local');

            if (!$isLocalEnv) {
                $subscriber = $this->revenueCat->getSubscriber($rcUserId);

                if (!$subscriber) {
                    return response()->json(['error' => 'Invalid RevenueCat user'], 401);
                }
            }

            $user = User::create([
                'name' => $isLocalEnv ? "Dev ({$rcUserId})" : 'Mobile User',
                'email' => $rcUserId . '@mobile.cloudclaw.com',
                'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(32)),
                'revenuecat_user_id' => $rcUserId,
                'subscription_status' => $isLocalEnv ? 'active' : null,
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

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
