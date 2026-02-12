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
            'serverBalance' => $this->creditService->getBalance($user),
            'llmBalance' => (float) $user->llm_credits,
            'llmBillingMode' => $user->llm_billing_mode,
            'transactions' => $this->creditService->getTransactions($user, 50),
            'packages' => $this->creditService->getCreditPackages(),
            'stripeKey' => config('services.stripe.key'),
            'mockMode' => $this->creditService->isMockMode(),
            'hasActiveSubscription' => $user->hasActiveSubscription(),
        ]);
    }

    /**
     * Create a Stripe Checkout session for credit purchase
     */
    public function purchase(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:5|max:1000',
            'type' => 'sometimes|string|in:server,llm',
        ]);

        $user = $request->user();
        $amount = (float) $validated['amount'];
        $type = $validated['type'] ?? 'server';

        try {
            $successUrl = route('credits.success', ['type' => $type]);
            $cancelUrl = route('credits.index');

            $session = $this->creditService->createCheckoutSession(
                $user,
                $amount,
                $successUrl,
                $cancelUrl,
                $type
            );

            // If mock mode, add credits directly
            if ($session['mock'] ?? false) {
                if ($type === 'llm') {
                    $user->increment('llm_credits', $amount);
                } else {
                    $this->creditService->addCredits(
                        $user,
                        $amount,
                        'purchase',
                        'Credit purchase (mock mode)'
                    );
                }

                return response()->json([
                    'success' => true,
                    'mock' => true,
                    'serverBalance' => $this->creditService->getBalance($user),
                    'llmBalance' => (float) $user->fresh()->llm_credits,
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
        $type = $request->get('type', 'server');
        $user = $request->user();

        // If mock mode
        if ($request->get('mock')) {
            return redirect()->route('credits.index')
                ->with('success', 'Crédits ajoutés avec succès !');
        }

        // Verify the checkout session
        if ($sessionId) {
            $result = $this->creditService->verifyCheckoutSession($sessionId);

            if ($result && (int) $result['user_id'] === $user->id) {
                // Check if already processed
                $existing = \App\Models\CreditTransaction::where('stripe_payment_intent_id', $result['payment_intent'])->first();
                
                if (!$existing) {
                    if ($type === 'llm') {
                        $user->increment('llm_credits', $result['amount']);
                        // Log the transaction
                        $this->creditService->addCredits(
                            $user,
                            0, // No server credits
                            'llm_purchase',
                            'LLM credit purchase: €' . $result['amount'],
                            $result['payment_intent']
                        );
                    } else {
                        $this->creditService->addCredits(
                            $user,
                            $result['amount'],
                            'purchase',
                            'Server credit purchase via Stripe',
                            $result['payment_intent']
                        );
                    }
                }

                $label = $type === 'llm' ? 'crédits LLM' : 'crédits serveur';
                return redirect()->route('credits.index')
                    ->with('success', 'Paiement réussi ! €' . $result['amount'] . ' ' . $label . ' ajoutés.');
            }
        }

        return redirect()->route('credits.index')
            ->with('info', 'Paiement en cours de traitement. Les crédits seront ajoutés sous peu.');
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
