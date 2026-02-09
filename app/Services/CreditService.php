<?php

namespace App\Services;

use App\Models\Credit;
use App\Models\CreditTransaction;
use App\Models\User;
use Stripe\StripeClient;

class CreditService
{
    protected ?StripeClient $stripe = null;

    public function __construct()
    {
        $stripeKey = config('services.stripe.secret');
        if ($stripeKey) {
            $this->stripe = new StripeClient($stripeKey);
        }
    }

    /**
     * Get or create credit account for user
     */
    public function getCredit(User $user): Credit
    {
        return $user->credit ?? Credit::create([
            'user_id' => $user->id,
            'balance' => 0,
        ]);
    }

    /**
     * Check if user has enough credits
     */
    public function hasEnoughCredits(User $user, float $amount): bool
    {
        return $this->getCredit($user)->hasEnoughCredits($amount);
    }

    /**
     * Add credits to user account
     */
    public function addCredits(User $user, float $amount, string $type = 'purchase', string $description = null, ?string $stripePaymentIntentId = null): CreditTransaction
    {
        $credit = $this->getCredit($user);
        return $credit->addCredits($amount, $type, $description, $stripePaymentIntentId);
    }

    /**
     * Deduct credits from user account
     */
    public function deductCredits(User $user, float $amount, string $description = null, ?int $serverId = null): ?CreditTransaction
    {
        $credit = $this->getCredit($user);
        return $credit->deductCredits($amount, $description, $serverId);
    }

    /**
     * Get user's credit balance
     */
    public function getBalance(User $user): float
    {
        return (float) $this->getCredit($user)->balance;
    }

    /**
     * Get user's transaction history
     */
    public function getTransactions(User $user, int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return CreditTransaction::where('user_id', $user->id)
            ->with('server')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Create a Stripe payment intent for credit purchase
     */
    public function createPaymentIntent(User $user, float $amount): ?array
    {
        if (!$this->stripe) {
            // Mock response for development
            return [
                'client_secret' => 'pi_mock_' . uniqid() . '_secret_' . uniqid(),
                'amount' => (int) ($amount * 100),
            ];
        }

        // Ensure user has a Stripe customer
        $customerId = $this->getOrCreateStripeCustomer($user);

        $paymentIntent = $this->stripe->paymentIntents->create([
            'amount' => (int) ($amount * 100), // Convert to cents
            'currency' => 'eur',
            'customer' => $customerId,
            'metadata' => [
                'user_id' => $user->id,
                'type' => 'credit_purchase',
            ],
        ]);

        return [
            'client_secret' => $paymentIntent->client_secret,
            'payment_intent_id' => $paymentIntent->id,
            'amount' => $paymentIntent->amount,
        ];
    }

    /**
     * Confirm payment and add credits
     */
    public function confirmPayment(string $paymentIntentId): ?CreditTransaction
    {
        if (!$this->stripe) {
            // Mock: extract user from paymentIntentId isn't possible, skip
            return null;
        }

        $paymentIntent = $this->stripe->paymentIntents->retrieve($paymentIntentId);

        if ($paymentIntent->status !== 'succeeded') {
            return null;
        }

        $userId = $paymentIntent->metadata['user_id'] ?? null;
        if (!$userId) {
            return null;
        }

        $user = User::find($userId);
        if (!$user) {
            return null;
        }

        $amount = $paymentIntent->amount / 100; // Convert from cents

        return $this->addCredits(
            $user,
            $amount,
            'purchase',
            'Credit purchase via Stripe',
            $paymentIntentId
        );
    }

    /**
     * Get or create Stripe customer for user
     */
    protected function getOrCreateStripeCustomer(User $user): string
    {
        if ($user->stripe_customer_id) {
            return $user->stripe_customer_id;
        }

        if (!$this->stripe) {
            $customerId = 'cus_mock_' . uniqid();
            $user->update(['stripe_customer_id' => $customerId]);
            return $customerId;
        }

        $customer = $this->stripe->customers->create([
            'email' => $user->email,
            'name' => $user->name,
            'metadata' => [
                'user_id' => $user->id,
            ],
        ]);

        $user->update(['stripe_customer_id' => $customer->id]);

        return $customer->id;
    }

    /**
     * Get available credit packages
     */
    public function getCreditPackages(): array
    {
        return [
            ['amount' => 5, 'label' => '€5', 'bonus' => 0],
            ['amount' => 10, 'label' => '€10', 'bonus' => 0],
            ['amount' => 25, 'label' => '€25', 'bonus' => 1],
            ['amount' => 50, 'label' => '€50', 'bonus' => 3],
            ['amount' => 100, 'label' => '€100', 'bonus' => 10],
        ];
    }
}
