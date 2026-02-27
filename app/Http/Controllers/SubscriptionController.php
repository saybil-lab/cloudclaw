<?php

namespace App\Http\Controllers;

use App\Jobs\AutoDeployJob;
use App\Jobs\RestartAssistantJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    /**
     * Create a Stripe checkout session for new subscription,
     * or upgrade an existing subscription in-place.
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'tier' => 'sometimes|string|in:starter,pro,beast',
        ]);

        $user = $request->user();
        $tier = $request->input('tier', 'starter');
        $tiers = config('services.stripe.tiers', []);
        $tierConfig = $tiers[$tier] ?? $tiers['starter'];
        $mockMode = config('services.stripe.mock', true);

        // ─── Upgrade existing subscription ───
        if ($user->hasActiveSubscription() && $user->subscription_tier !== $tier) {
            return $this->handleUpgrade($user, $tier, $tierConfig, $mockMode);
        }

        // ─── New subscription ───
        return $this->handleNewSubscription($user, $tier, $tierConfig, $mockMode);
    }

    protected function handleUpgrade($user, string $tier, array $tierConfig, bool $mockMode)
    {
        $oldTier = $user->subscription_tier;
        $tiers = config('services.stripe.tiers', []);
        $oldCredits = $tiers[$oldTier]['credits'] ?? 0;
        $newCredits = $tierConfig['credits'];
        $bonusCredits = max(0, $newCredits - $oldCredits);

        if ($mockMode) {
            $user->update(['subscription_tier' => $tier]);

            // Grant the difference in credits
            if ($bonusCredits > 0) {
                $user->increment('llm_credits', $bonusCredits);
            }

            // Restart assistant if stopped
            $stoppedServer = $user->servers()->where('status', 'stopped')->first();
            if ($stoppedServer) {
                RestartAssistantJob::dispatch($user->id);
            }

            return response()->json([
                'mock' => true,
                'success' => true,
                'message' => "Upgraded to {$tier} (development mode)",
            ]);
        }

        // Real Stripe: swap the price on the existing subscription
        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

        if (!$user->stripe_subscription_id) {
            Log::error('Upgrade failed: no stripe_subscription_id', ['user_id' => $user->id]);
            return response()->json([
                'error' => 'No active subscription found. Please contact support.',
            ], 400);
        }

        $newPriceId = $tierConfig['stripe_price_id'];
        if (!$newPriceId) {
            return response()->json([
                'error' => 'Payment configuration error. Please contact support.',
            ], 500);
        }

        try {
            // Retrieve the subscription and its current item
            $subscription = $stripe->subscriptions->retrieve($user->stripe_subscription_id);
            $itemId = $subscription->items->data[0]->id;

            // Swap the price — prorate so user pays the difference immediately
            $stripe->subscriptions->update($user->stripe_subscription_id, [
                'items' => [[
                    'id' => $itemId,
                    'price' => $newPriceId,
                ]],
                'proration_behavior' => 'create_prorations',
                'metadata' => [
                    'tier' => $tier,
                    'upgraded_from' => $oldTier,
                ],
            ]);

            // Update user immediately (webhook will also confirm)
            $user->update(['subscription_tier' => $tier]);

            // Grant bonus credits (difference between tiers)
            if ($bonusCredits > 0) {
                $user->increment('llm_credits', $bonusCredits);
            }

            // Restart assistant if stopped
            $stoppedServer = $user->servers()->where('status', 'stopped')->first();
            if ($stoppedServer) {
                RestartAssistantJob::dispatch($user->id);
            }

            Log::info('Subscription upgraded via Stripe', [
                'user_id' => $user->id,
                'from' => $oldTier,
                'to' => $tier,
                'bonus_credits' => $bonusCredits,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Upgraded to {$tier}",
            ]);

        } catch (\Exception $e) {
            Log::error('Stripe subscription upgrade failed', [
                'user_id' => $user->id,
                'tier' => $tier,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to upgrade. Please try again.',
            ], 500);
        }
    }

    protected function handleNewSubscription($user, string $tier, array $tierConfig, bool $mockMode)
    {
        if ($mockMode) {
            $user->update([
                'subscription_status' => 'active',
                'subscription_tier' => $tier,
            ]);

            $user->increment('llm_credits', $tierConfig['credits']);

            $stoppedServer = $user->servers()->where('status', 'stopped')->first();
            if ($stoppedServer) {
                RestartAssistantJob::dispatch($user->id);
            } else {
                AutoDeployJob::dispatch($user->id);
            }

            return response()->json([
                'mock' => true,
                'success' => true,
                'message' => 'Subscription activated (development mode)',
            ]);
        }

        // Real Stripe checkout
        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
        $priceId = $tierConfig['stripe_price_id'];

        if (!$priceId) {
            Log::error('Stripe price ID not configured for tier', ['tier' => $tier]);
            return response()->json([
                'error' => 'Payment configuration error. Please contact support.',
            ], 500);
        }

        try {
            if (!$user->stripe_customer_id) {
                $customer = $stripe->customers->create([
                    'email' => $user->email,
                    'name' => $user->name,
                    'metadata' => ['user_id' => $user->id],
                ]);
                $user->update(['stripe_customer_id' => $customer->id]);
            }

            $session = $stripe->checkout->sessions->create([
                'customer' => $user->stripe_customer_id,
                'mode' => 'subscription',
                'line_items' => [[
                    'price' => $priceId,
                    'quantity' => 1,
                ]],
                'allow_promotion_codes' => true,
                'success_url' => route('subscription.success') . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('dashboard'),
                'metadata' => [
                    'user_id' => $user->id,
                    'type' => 'subscription',
                    'tier' => $tier,
                ],
            ]);

            return response()->json(['url' => $session->url]);

        } catch (\Exception $e) {
            Log::error('Stripe subscription checkout failed', [
                'user_id' => $user->id,
                'tier' => $tier,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to create checkout session. Please try again.',
            ], 500);
        }
    }

    /**
     * Handle successful subscription redirect
     */
    public function success(Request $request)
    {
        $sessionId = $request->query('session_id');
        $user = $request->user();

        if ($sessionId) {
            try {
                $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
                $session = $stripe->checkout->sessions->retrieve($sessionId);

                if ($session->payment_status === 'paid' && $session->metadata->user_id == $user->id) {
                    $tier = $session->metadata->tier ?? 'starter';
                    $subscriptionId = $session->subscription ?? null;
                    $user->update([
                        'subscription_status' => 'active',
                        'subscription_tier' => $tier,
                        'stripe_subscription_id' => $subscriptionId,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to verify subscription session', [
                    'session_id' => $sessionId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return redirect()->route('dashboard')->with('success', 'Subscription activated successfully!')->with('gtm_event', 'purchase');
    }
}
