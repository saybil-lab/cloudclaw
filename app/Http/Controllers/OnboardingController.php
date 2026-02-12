<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\CreditService;

class OnboardingController extends Controller
{
    protected CreditService $creditService;

    public function __construct(CreditService $creditService)
    {
        $this->creditService = $creditService;
    }

    /**
     * Show the onboarding page.
     */
    public function index()
    {
        $user = auth()->user();

        // If user has already completed onboarding, redirect to dashboard
        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Complete onboarding and redirect to Stripe checkout.
     */
    public function complete(Request $request)
    {
        $request->validate([
            'use_case' => 'required|string',
            'team_size' => 'required|string',
            'priority' => 'required|string',
        ]);

        $user = auth()->user();

        // Save onboarding data
        $user->update([
            'use_case' => $request->use_case,
            'team_size' => $request->team_size,
            'priority' => $request->priority,
        ]);

        // Create Stripe checkout session for subscription
        try {
            $checkoutUrl = $this->creditService->createSubscriptionCheckout($user);
            return Inertia::location($checkoutUrl);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Unable to create checkout session. Please try again.']);
        }
    }

    /**
     * Handle successful subscription checkout.
     */
    public function success(Request $request)
    {
        $user = auth()->user();
        $sessionId = $request->query('session_id');
        $isMock = $request->query('mock') === 'true';

        // In mock mode, just activate the subscription
        if ($isMock || $this->creditService->isMockMode()) {
            $user->update([
                'onboarding_completed' => true,
                'subscription_status' => 'active',
            ]);

            return redirect()->route('dashboard')->with('success', 'Welcome to ClawdClaw! Your subscription is now active.');
        }

        // Verify the checkout session with Stripe
        if ($sessionId) {
            try {
                $session = $this->creditService->verifyCheckoutSession($sessionId);

                if ($session && $session['status'] === 'paid') {
                    $user->update([
                        'onboarding_completed' => true,
                        'subscription_status' => 'active',
                    ]);

                    return redirect()->route('dashboard')->with('success', 'Welcome to ClawdClaw! Your subscription is now active.');
                }
            } catch (\Exception $e) {
                \Log::error('Failed to verify checkout session', [
                    'session_id' => $sessionId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // If verification fails, still redirect but without activating subscription
        // The webhook will handle the activation
        return redirect()->route('dashboard')->with('info', 'Your payment is being processed. Please check back shortly.');
    }
}
