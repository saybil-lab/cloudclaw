<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $tiers = config('services.stripe.tiers', []);
        $currentTier = $user->subscription_tier ?? 'starter';

        return Inertia::render('Settings/Index', [
            'hasActiveSubscription' => $user->hasActiveSubscription(),
            'subscriptionTier' => $currentTier,
            'subscriptionStatus' => $user->subscription_status,
            'llmCredits' => (float) $user->llm_credits,
            'tierCredits' => $tiers[$currentTier]['credits'] ?? 14,
            'tierPrice' => $tiers[$currentTier]['price'] ?? 9,
            'tiers' => collect($tiers)->map(fn($t, $k) => [
                'name' => $k,
                'price' => $t['price'],
                'credits' => $t['credits'],
            ])->values(),
            'userEmail' => $user->email,
            'userName' => $user->name,
        ]);
    }

    public function updateLlmBillingMode(Request $request)
    {
        $validated = $request->validate([
            'llm_billing_mode' => 'required|in:credits,byok',
        ]);

        $user = $request->user();

        if ($validated['llm_billing_mode'] === 'byok' && !$user->hasLlmApiKey()) {
            return back()->withErrors(['error' => 'Please configure at least one API key first.']);
        }

        $user->update(['llm_billing_mode' => $validated['llm_billing_mode']]);

        return back()->with('success', 'LLM billing mode updated.');
    }

    public function updateApiKey(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|in:anthropic,openai',
            'api_key' => 'required|string|min:10',
        ]);

        $provider = $validated['provider'];
        $apiKey = $validated['api_key'];

        $isValid = $this->validateApiKey($provider, $apiKey);

        if (!$isValid) {
            return back()->withErrors(['api_key' => 'Invalid API key. Please check your key and try again.']);
        }

        $field = $provider === 'anthropic' ? 'anthropic_api_key' : 'openai_api_key';
        $request->user()->update([$field => $apiKey]);

        $runningServers = $request->user()->servers()->where('status', 'running')->get();
        foreach ($runningServers as $server) {
            \App\Jobs\SyncLlmKeyJob::dispatch($server, $provider, $apiKey);
        }

        return back()->with('success', ucfirst($provider) . ' API key saved and syncing to your assistants.');
    }

    public function removeApiKey(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|in:anthropic,openai',
        ]);

        $user = $request->user();
        $provider = $validated['provider'];
        $field = $provider === 'anthropic' ? 'anthropic_api_key' : 'openai_api_key';

        $otherField = $provider === 'anthropic' ? 'openai_api_key' : 'anthropic_api_key';

        if ($user->isLlmByokMode() && empty($user->$otherField)) {
            $user->update([
                $field => null,
                'llm_billing_mode' => 'credits',
            ]);
            return back()->with('success', 'API key removed. Billing mode switched to Credits.');
        }

        $user->update([$field => null]);

        return back()->with('success', ucfirst($provider) . ' API key removed.');
    }

    protected function validateApiKey(string $provider, string $apiKey): bool
    {
        try {
            if ($provider === 'anthropic') {
                $response = Http::withHeaders([
                    'X-Api-Key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                ])->get('https://api.anthropic.com/v1/models');

                return $response->successful() || $response->status() === 200;
            } else {
                $response = Http::withToken($apiKey)
                    ->get('https://api.openai.com/v1/models');

                return $response->successful();
            }
        } catch (\Exception $e) {
            return false;
        }
    }
}
