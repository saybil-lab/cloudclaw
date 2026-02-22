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
     * Complete onboarding and redirect to dashboard.
     */
    public function complete(Request $request)
    {
        $request->validate([
            'use_case' => 'required|string',
            'team_size' => 'required|string',
            'priority' => 'required|string',
        ]);

        $user = auth()->user();

        // Save onboarding data and mark as completed
        $user->update([
            'use_case' => $request->use_case,
            'team_size' => $request->team_size,
            'priority' => $request->priority,
            'onboarding_completed' => true,
        ]);

        session()->flash('gtm_event', 'onboarding_complete');

        // Redirect to dashboard where they'll see the subscription CTA
        return redirect()->route('dashboard');
    }

    /**
     * Handle successful subscription checkout.
     */
    public function success(Request $request)
    {
        $user = auth()->user();
        $sessionId = $request->query('session_id');

        // Mark onboarding as completed (subscription will be handled separately via dashboard CTA)
        $user->update([
            'onboarding_completed' => true,
        ]);

        // If we have a session ID, verify it with Stripe
        if ($sessionId) {
            try {
                $session = $this->creditService->verifyCheckoutSession($sessionId);

                if ($session && $session['status'] === 'paid') {
                    $user->update([
                        'subscription_status' => 'active',
                    ]);

                    return redirect()->route('dashboard')->with('success', 'Welcome to Clawdclaw! Your subscription is now active.');
                }
            } catch (\Exception $e) {
                \Log::error('Failed to verify checkout session', [
                    'session_id' => $sessionId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Redirect to dashboard where they'll see the subscription CTA
        return redirect()->route('dashboard')->with('info', 'Welcome to Clawdclaw! Subscribe to get started.');
    }
}
