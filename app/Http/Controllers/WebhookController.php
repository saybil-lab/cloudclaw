<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\CreditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use Stripe\StripeClient;

class WebhookController extends Controller
{
    protected CreditService $creditService;
    protected ?StripeClient $stripe = null;

    public function __construct(CreditService $creditService)
    {
        $this->creditService = $creditService;
        
        $stripeKey = config('services.stripe.secret');
        if ($stripeKey) {
            $this->stripe = new StripeClient($stripeKey);
        }
    }

    /**
     * Handle Stripe webhook events
     */
    public function handleStripe(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        // Verify webhook signature if secret is configured
        if ($webhookSecret) {
            try {
                $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            } catch (\UnexpectedValueException $e) {
                Log::error('Stripe webhook: Invalid payload', ['error' => $e->getMessage()]);
                return response()->json(['error' => 'Invalid payload'], 400);
            } catch (SignatureVerificationException $e) {
                Log::error('Stripe webhook: Invalid signature', ['error' => $e->getMessage()]);
                return response()->json(['error' => 'Invalid signature'], 400);
            }
        } else {
            // No webhook secret configured, parse payload directly (development mode)
            $event = json_decode($payload);
            if (!$event || !isset($event->type)) {
                return response()->json(['error' => 'Invalid payload'], 400);
            }
        }

        Log::info('Stripe webhook received', ['type' => $event->type ?? $event['type']]);

        // Handle the event
        $eventType = is_array($event) ? $event['type'] : $event->type;
        $eventData = is_array($event) ? $event['data']['object'] : $event->data->object;

        switch ($eventType) {
            case 'checkout.session.completed':
                return $this->handleCheckoutSessionCompleted($eventData);

            case 'payment_intent.succeeded':
                return $this->handlePaymentIntentSucceeded($eventData);

            case 'payment_intent.payment_failed':
                return $this->handlePaymentIntentFailed($eventData);

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                return $this->handleSubscriptionEvent($eventData);

            case 'customer.subscription.deleted':
                return $this->handleSubscriptionDeleted($eventData);

            case 'invoice.paid':
                return $this->handleInvoicePaid($eventData);

            case 'invoice.payment_failed':
                return $this->handleInvoicePaymentFailed($eventData);

            default:
                Log::debug('Unhandled Stripe webhook event', ['type' => $eventType]);
                return response()->json(['status' => 'ignored']);
        }
    }

    /**
     * Handle checkout.session.completed event
     * This is the main event for Stripe Checkout integration
     */
    protected function handleCheckoutSessionCompleted($session)
    {
        Log::info('Processing checkout.session.completed', [
            'session_id' => $session->id ?? $session['id'],
        ]);

        try {
            // Extract metadata
            $metadata = is_object($session) ? ($session->metadata ?? new \stdClass()) : ($session['metadata'] ?? []);
            $userId = is_object($metadata) ? ($metadata->user_id ?? null) : ($metadata['user_id'] ?? null);
            $creditAmount = is_object($metadata) ? ($metadata->credit_amount ?? null) : ($metadata['credit_amount'] ?? null);

            if (!$userId) {
                Log::warning('Checkout session missing user_id in metadata', [
                    'session_id' => $session->id ?? $session['id'],
                ]);
                return response()->json(['error' => 'Missing user_id'], 400);
            }

            $user = User::find($userId);
            if (!$user) {
                Log::error('User not found for checkout session', ['user_id' => $userId]);
                return response()->json(['error' => 'User not found'], 404);
            }

            // Get amount from session
            $amountTotal = is_object($session) ? ($session->amount_total ?? 0) : ($session['amount_total'] ?? 0);
            $amount = $creditAmount ?? ($amountTotal / 100); // Convert from cents if not in metadata

            if ($amount <= 0) {
                Log::error('Invalid amount in checkout session', ['amount' => $amount]);
                return response()->json(['error' => 'Invalid amount'], 400);
            }

            // Get payment intent ID for reference
            $paymentIntentId = is_object($session) 
                ? ($session->payment_intent ?? null) 
                : ($session['payment_intent'] ?? null);

            // Add credits to user account
            $transaction = $this->creditService->addCredits(
                $user,
                $amount,
                'purchase',
                'Credit purchase via Stripe Checkout',
                $paymentIntentId
            );

            Log::info('Credits added from checkout session', [
                'user_id' => $user->id,
                'amount' => $amount,
                'transaction_id' => $transaction->id,
            ]);

            return response()->json([
                'status' => 'success',
                'credits_added' => $amount,
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing checkout session', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Processing error'], 500);
        }
    }

    /**
     * Handle payment_intent.succeeded event
     */
    protected function handlePaymentIntentSucceeded($paymentIntent)
    {
        Log::info('Processing payment_intent.succeeded', [
            'payment_intent_id' => $paymentIntent->id ?? $paymentIntent['id'],
        ]);

        try {
            $metadata = is_object($paymentIntent) 
                ? ($paymentIntent->metadata ?? new \stdClass()) 
                : ($paymentIntent['metadata'] ?? []);
            
            $userId = is_object($metadata) ? ($metadata->user_id ?? null) : ($metadata['user_id'] ?? null);
            $type = is_object($metadata) ? ($metadata->type ?? null) : ($metadata['type'] ?? null);

            // Only process credit purchases
            if ($type !== 'credit_purchase' || !$userId) {
                return response()->json(['status' => 'ignored']);
            }

            $user = User::find($userId);
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $amount = is_object($paymentIntent) 
                ? (($paymentIntent->amount ?? 0) / 100) 
                : (($paymentIntent['amount'] ?? 0) / 100);

            $paymentIntentId = is_object($paymentIntent) 
                ? $paymentIntent->id 
                : $paymentIntent['id'];

            // Check if already processed (idempotency)
            $existing = \App\Models\CreditTransaction::where('stripe_payment_intent_id', $paymentIntentId)->first();
            if ($existing) {
                Log::info('Payment intent already processed', ['payment_intent_id' => $paymentIntentId]);
                return response()->json(['status' => 'already_processed']);
            }

            $this->creditService->addCredits(
                $user,
                $amount,
                'purchase',
                'Credit purchase via Stripe',
                $paymentIntentId
            );

            Log::info('Credits added from payment intent', [
                'user_id' => $user->id,
                'amount' => $amount,
            ]);

            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            Log::error('Error processing payment intent', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Processing error'], 500);
        }
    }

    /**
     * Handle payment_intent.payment_failed event
     */
    protected function handlePaymentIntentFailed($paymentIntent)
    {
        Log::warning('Payment intent failed', [
            'payment_intent_id' => $paymentIntent->id ?? $paymentIntent['id'],
            'error' => $paymentIntent->last_payment_error ?? $paymentIntent['last_payment_error'] ?? null,
        ]);

        return response()->json(['status' => 'logged']);
    }

    /**
     * Handle subscription events
     */
    protected function handleSubscriptionEvent($subscription)
    {
        Log::info('Subscription event received', [
            'subscription_id' => $subscription->id ?? $subscription['id'],
            'status' => $subscription->status ?? $subscription['status'],
        ]);

        // TODO: Implement subscription handling if needed
        return response()->json(['status' => 'logged']);
    }

    /**
     * Handle subscription deleted event
     */
    protected function handleSubscriptionDeleted($subscription)
    {
        Log::info('Subscription deleted', [
            'subscription_id' => $subscription->id ?? $subscription['id'],
        ]);

        // TODO: Implement subscription cancellation handling
        return response()->json(['status' => 'logged']);
    }

    /**
     * Handle invoice.paid event
     */
    protected function handleInvoicePaid($invoice)
    {
        Log::info('Invoice paid', [
            'invoice_id' => $invoice->id ?? $invoice['id'],
        ]);

        // TODO: Handle recurring payments if subscriptions are implemented
        return response()->json(['status' => 'logged']);
    }

    /**
     * Handle invoice.payment_failed event
     */
    protected function handleInvoicePaymentFailed($invoice)
    {
        Log::warning('Invoice payment failed', [
            'invoice_id' => $invoice->id ?? $invoice['id'],
        ]);

        // TODO: Notify user about failed payment
        return response()->json(['status' => 'logged']);
    }
}
