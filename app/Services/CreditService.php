<?php

namespace App\Services;

use App\Models\Credit;
use App\Models\CreditTransaction;
use App\Models\User;
use Stripe\StripeClient;
use Illuminate\Support\Facades\Log;

class CreditService
{
    protected ?StripeClient $stripe = null;

    public function __construct()
    {
        $stripeKey = config('services.stripe.secret');
        if ($stripeKey && !config('services.stripe.mock', false)) {
            $this->stripe = new StripeClient($stripeKey);
        }
    }

    /**
     * Check if Stripe is in mock mode
     */
    public function isMockMode(): bool
    {
        return config('services.stripe.mock', false) || !$this->stripe;
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
     * Create a Stripe Checkout Session for credit purchase
     * This is the recommended way to handle payments with Stripe
     * 
     * @param string $creditType 'server' for server credits, 'llm' for LLM credits
     */
    public function createCheckoutSession(User $user, float $amount, string $successUrl, string $cancelUrl, string $creditType = 'server'): array
    {
        if ($this->isMockMode()) {
            // Mock response for development
            return [
                'id' => 'cs_mock_' . uniqid(),
                'url' => $successUrl . '?mock=true&amount=' . $amount,
                'mock' => true,
            ];
        }

        // Ensure user has a Stripe customer
        $customerId = $this->getOrCreateStripeCustomer($user);

        $productName = $creditType === 'llm' ? 'CloudClaw LLM Credits' : 'CloudClaw Server Credits';
        $productDescription = $creditType === 'llm' 
            ? "${$amount} in LLM credits for AI models"
            : "${$amount} in server hosting credits";

        try {
            $session = $this->stripe->checkout->sessions->create([
                'customer' => $customerId,
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => $productName,
                            'description' => $productDescription,
                        ],
                        'unit_amount' => (int) ($amount * 100), // Convert to cents
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $successUrl . '&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $cancelUrl,
                'metadata' => [
                    'user_id' => $user->id,
                    'credit_amount' => $amount,
                    'credit_type' => $creditType,
                    'type' => $creditType === 'llm' ? 'llm_credit_purchase' : 'server_credit_purchase',
                ],
            ]);

            Log::info('Stripe Checkout session created', [
                'session_id' => $session->id,
                'user_id' => $user->id,
                'amount' => $amount,
                'credit_type' => $creditType,
            ]);

            return [
                'id' => $session->id,
                'url' => $session->url,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to create Stripe Checkout session', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Create a Stripe payment intent for credit purchase (legacy)
     */
    public function createPaymentIntent(User $user, float $amount): ?array
    {
        if ($this->isMockMode()) {
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
        if ($this->isMockMode()) {
            // Mock: can't process without real Stripe
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
     * Verify a checkout session and return details
     */
    public function verifyCheckoutSession(string $sessionId): ?array
    {
        if ($this->isMockMode()) {
            return null;
        }

        try {
            $session = $this->stripe->checkout->sessions->retrieve($sessionId);

            if ($session->payment_status === 'paid') {
                return [
                    'user_id' => $session->metadata['user_id'] ?? null,
                    'amount' => $session->metadata['credit_amount'] ?? ($session->amount_total / 100),
                    'payment_intent' => $session->payment_intent,
                    'status' => $session->payment_status,
                ];
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Failed to verify checkout session', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get or create Stripe customer for user
     */
    protected function getOrCreateStripeCustomer(User $user): string
    {
        if ($user->stripe_customer_id) {
            return $user->stripe_customer_id;
        }

        if ($this->isMockMode()) {
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
            ['amount' => 5, 'label' => '$5', 'bonus' => 0],
            ['amount' => 10, 'label' => '$10', 'bonus' => 0],
            ['amount' => 25, 'label' => '$25', 'bonus' => 1],
            ['amount' => 50, 'label' => '$50', 'bonus' => 3],
            ['amount' => 100, 'label' => '$100', 'bonus' => 10],
        ];
    }

    /**
     * Create a Stripe Checkout Session for subscription ($39/month)
     */
    public function createSubscriptionCheckout(User $user): string
    {
        $successUrl = route('onboarding.success') . '?session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = route('onboarding');

        if ($this->isMockMode()) {
            // Mock response for development - redirect to success with mock parameter
            return route('onboarding.success') . '?mock=true';
        }

        // Ensure user has a Stripe customer
        $customerId = $this->getOrCreateStripeCustomer($user);

        try {
            // First, create or get the price for the subscription
            $price = $this->getOrCreateSubscriptionPrice();

            $session = $this->stripe->checkout->sessions->create([
                'customer' => $customerId,
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price' => $price->id,
                    'quantity' => 1,
                ]],
                'mode' => 'subscription',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata' => [
                    'user_id' => $user->id,
                    'type' => 'subscription',
                ],
                'subscription_data' => [
                    'metadata' => [
                        'user_id' => $user->id,
                    ],
                ],
            ]);

            Log::info('Stripe Subscription Checkout session created', [
                'session_id' => $session->id,
                'user_id' => $user->id,
            ]);

            return $session->url;

        } catch (\Exception $e) {
            Log::error('Failed to create Stripe Subscription Checkout session', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get or create the subscription price in Stripe
     */
    protected function getOrCreateSubscriptionPrice(): \Stripe\Price
    {
        // Check if we have a price ID in config
        $priceId = config('services.stripe.subscription_price_id');

        if ($priceId) {
            return $this->stripe->prices->retrieve($priceId);
        }

        // Create a product and price for the subscription
        $product = $this->stripe->products->create([
            'name' => 'ClawdClaw Pro',
            'description' => 'Your personal AI assistant - $39/month',
        ]);

        $price = $this->stripe->prices->create([
            'product' => $product->id,
            'unit_amount' => 3900, // $39 in cents
            'currency' => 'usd',
            'recurring' => [
                'interval' => 'month',
            ],
        ]);

        Log::info('Created Stripe subscription price', [
            'price_id' => $price->id,
            'product_id' => $product->id,
        ]);

        return $price;
    }
}
