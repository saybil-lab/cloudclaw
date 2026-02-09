<?php

namespace App\Http\Controllers;

use App\Services\CreditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditController extends Controller
{
    public function __construct(
        protected CreditService $creditService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Credits/Index', [
            'balance' => $this->creditService->getBalance($user),
            'transactions' => $this->creditService->getTransactions($user, 50),
            'packages' => $this->creditService->getCreditPackages(),
            'stripeKey' => config('services.stripe.key'),
            'mockMode' => $this->creditService->isMockMode(),
        ]);
    }

    /**
     * Create a Stripe Checkout session for credit purchase
     */
    public function purchase(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:5|max:1000',
        ]);

        $user = $request->user();
        $amount = (float) $validated['amount'];

        try {
            $successUrl = route('credits.success');
            $cancelUrl = route('credits.index');

            $session = $this->creditService->createCheckoutSession(
                $user,
                $amount,
                $successUrl,
                $cancelUrl
            );

            // If mock mode, add credits directly and redirect
            if ($session['mock'] ?? false) {
                $this->creditService->addCredits(
                    $user,
                    $amount,
                    'purchase',
                    'Credit purchase (mock mode)'
                );

                return response()->json([
                    'success' => true,
                    'mock' => true,
                    'balance' => $this->creditService->getBalance($user),
                ]);
            }

            return response()->json([
                'sessionId' => $session['id'],
                'url' => $session['url'],
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle successful payment return
     */
    public function success(Request $request)
    {
        $sessionId = $request->get('session_id');
        $user = $request->user();

        // If mock mode
        if ($request->get('mock')) {
            return redirect()->route('credits.index')
                ->with('success', 'Credits added successfully!');
        }

        // Verify the checkout session
        if ($sessionId) {
            $result = $this->creditService->verifyCheckoutSession($sessionId);

            if ($result && (int) $result['user_id'] === $user->id) {
                // Check if already processed
                $existing = \App\Models\CreditTransaction::where('stripe_payment_intent_id', $result['payment_intent'])->first();
                
                if (!$existing) {
                    $this->creditService->addCredits(
                        $user,
                        $result['amount'],
                        'purchase',
                        'Credit purchase via Stripe',
                        $result['payment_intent']
                    );
                }

                return redirect()->route('credits.index')
                    ->with('success', 'Payment successful! €' . $result['amount'] . ' credits added.');
            }
        }

        return redirect()->route('credits.index')
            ->with('info', 'Payment processing. Credits will be added shortly.');
    }

    /**
     * Legacy: Confirm payment intent
     */
    public function confirm(Request $request)
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
            'amount' => 'required|numeric',
        ]);

        $user = $request->user();
        
        // In mock mode, just add the credits directly
        if ($this->creditService->isMockMode()) {
            $transaction = $this->creditService->addCredits(
                $user,
                (float) $validated['amount'],
                'purchase',
                'Credit purchase'
            );

            return response()->json([
                'success' => true,
                'balance' => $this->creditService->getBalance($user),
                'transaction' => $transaction,
            ]);
        }

        // Real Stripe confirmation
        $transaction = $this->creditService->confirmPayment($validated['payment_intent_id']);

        if (!$transaction) {
            return response()->json(['error' => 'Payment confirmation failed'], 400);
        }

        return response()->json([
            'success' => true,
            'balance' => $this->creditService->getBalance($user),
            'transaction' => $transaction,
        ]);
    }
}
