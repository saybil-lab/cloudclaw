<?php

namespace App\Http\Controllers;

use App\Jobs\AutoDeployJob;
use App\Jobs\RestartAssistantJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    /**
     * Create a Stripe checkout session for subscription
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

        // Check if in mock/development mode
        $mockMode = config('services.stripe.mock', true);

        if ($mockMode) {
            // In development, directly activate the subscription
            $user->update([
                'subscription_status' => 'active',
                'subscription_tier' => $tier,
            ]);

            // Grant tier credits
            $user->increment('llm_credits', $tierConfig['credits']);

            // Restart stopped assistant or deploy new one
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

        // Real Stripe integration
        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
        $priceId = $tierConfig['stripe_price_id'];

        if (!$priceId) {
            Log::error('Stripe price ID not configured for tier', ['tier' => $tier]);
            return response()->json([
                'error' => 'Payment configuration error. Please contact support.',
            ], 500);
        }

        try {
            // Get or create Stripe customer
            if (!$user->stripe_customer_id) {
                $customer = $stripe->customers->create([
                    'email' => $user->email,
                    'name' => $user->name,
                    'metadata' => [
                        'user_id' => $user->id,
                    ],
                ]);
                $user->update(['stripe_customer_id' => $customer->id]);
            }

            // Create checkout session for subscription
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

            return response()->json([
                'url' => $session->url,
            ]);

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
     * Handle successful subscription
     */
    public function success(Request $request)
    {
        $sessionId = $request->query('session_id');
        $user = $request->user();

        if ($sessionId) {
            // Verify the session with Stripe
            try {
                $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
                $session = $stripe->checkout->sessions->retrieve($sessionId);

                if ($session->payment_status === 'paid' && $session->metadata->user_id == $user->id) {
                    $tier = $session->metadata->tier ?? 'starter';
                    $user->update([
                        'subscription_status' => 'active',
                        'subscription_tier' => $tier,
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
