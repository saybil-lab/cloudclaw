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
        ]);
    }

    public function purchase(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:5|max:1000',
        ]);

        $user = $request->user();
        $amount = (float) $validated['amount'];

        try {
            $paymentIntent = $this->creditService->createPaymentIntent($user, $amount);

            return response()->json([
                'clientSecret' => $paymentIntent['client_secret'],
                'amount' => $amount,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function confirm(Request $request)
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
            'amount' => 'required|numeric',
        ]);

        $user = $request->user();
        
        // In mock mode, just add the credits directly
        if (config('services.stripe.mock', true)) {
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
