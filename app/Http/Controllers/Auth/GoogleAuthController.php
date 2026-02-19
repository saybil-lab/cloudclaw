<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            \Illuminate\Support\Facades\Log::info('Google Auth Callback Started');
            
            $googleUser = Socialite::driver('google')->stateless()->user();
            \Illuminate\Support\Facades\Log::info('Google User Retrieved', ['email' => $googleUser->getEmail(), 'id' => $googleUser->getId()]);
            
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                \Illuminate\Support\Facades\Log::info('Creating new user');
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => bcrypt(Str::random(16)),
                    'email_verified_at' => now(),
                ]);
            } else {
                \Illuminate\Support\Facades\Log::info('Updating existing user', ['id' => $user->id]);
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            }

            Auth::login($user);
            \Illuminate\Support\Facades\Log::info('User logged in', ['id' => $user->id]);

            // // Check if user has active subscription
            // if ($user->hasActiveSubscription()) {
            //     \Illuminate\Support\Facades\Log::info('User has active subscription, redirecting to dashboard');
            //     return redirect()->intended(route('dashboard'));
            // }

            return redirect()->intended(route('dashboard'));

            // --- STRIPE REDIRECT LOGIC ---
            
            // 1. Check for Mock Mode
            // $mockMode = config('services.stripe.mock', true);
            // if ($mockMode) {
            //     \Illuminate\Support\Facades\Log::info('Mock mode active, activating subscription and redirecting to dashboard');
            //     $user->update(['subscription_status' => 'active']);
            //     return redirect()->route('dashboard')->with('success', 'Subscription activated (Mock Mode)');
            // }

            // 2. Real Stripe Logic
            // $stripeSecret = config('services.stripe.secret');
            // $priceId = config('services.stripe.price_id');

            // if (!$stripeSecret || !$priceId) {
            //     \Illuminate\Support\Facades\Log::error('Stripe configuration missing', ['secret_set' => !!$stripeSecret, 'price_id_set' => !!$priceId]);
            //     return redirect()->route('dashboard')->with('error', 'Payment configuration error.');
            // }

            // $stripe = new \Stripe\StripeClient($stripeSecret);

            // // Get or Create Stripe Customer
            // if (!$user->stripe_customer_id) {
            //     $customer = $stripe->customers->create([
            //         'email' => $user->email,
            //         'name' => $user->name,
            //         'metadata' => ['user_id' => $user->id],
            //     ]);
            //     $user->update(['stripe_customer_id' => $customer->id]);
            // }

            // // Create Checkout Session
            // $session = $stripe->checkout->sessions->create([
            //     'customer' => $user->stripe_customer_id,
            //     'mode' => 'subscription',
            //     'line_items' => [[
            //         'price' => $priceId,
            //         'quantity' => 1,
            //     ]],
            //     'allow_promotion_codes' => true,
            //     'success_url' => route('subscription.success') . '?session_id={CHECKOUT_SESSION_ID}',
            //     'cancel_url' => route('dashboard'), // Or maybe back to welcome?
            //     'metadata' => ['user_id' => $user->id],
            // ]);

            // \Illuminate\Support\Facades\Log::info('Redirecting to Stripe Checkout', ['url' => $session->url]);
            // return redirect($session->url);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google Login Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return redirect()->route('login')->with('error', 'Something went wrong with Google Login: ' . $e->getMessage());
        }
    }
}
