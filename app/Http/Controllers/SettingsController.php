<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Settings/Index', [
            'llmBillingMode' => $user->llm_billing_mode,
            'hasAnthropicKey' => !empty($user->anthropic_api_key),
            'hasOpenaiKey' => !empty($user->openai_api_key),
            'llmCredits' => (float) $user->llm_credits,
            'serverCredits' => (float) $user->getOrCreateCredit()->balance,
            'hasActiveSubscription' => $user->hasActiveSubscription(),
        ]);
    }

    public function updateLlmBillingMode(Request $request)
    {
        $validated = $request->validate([
            'llm_billing_mode' => 'required|in:credits,byok',
        ]);

        $user = $request->user();
        
        // If switching to BYOK, check if at least one API key is configured
        if ($validated['llm_billing_mode'] === 'byok' && !$user->hasLlmApiKey()) {
            return back()->withErrors(['error' => 'Veuillez d\'abord configurer au moins une clé API.']);
        }

        $user->update(['llm_billing_mode' => $validated['llm_billing_mode']]);

        return back()->with('success', 'Mode de facturation LLM mis à jour.');
    }

    public function updateApiKey(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|in:anthropic,openai',
            'api_key' => 'required|string|min:10',
        ]);

        $provider = $validated['provider'];
        $apiKey = $validated['api_key'];

        // Validate the API key
        $isValid = $this->validateApiKey($provider, $apiKey);
        
        if (!$isValid) {
            return back()->withErrors(['api_key' => 'Clé API invalide. Veuillez vérifier votre clé.']);
        }

        $field = $provider === 'anthropic' ? 'anthropic_api_key' : 'openai_api_key';
        $request->user()->update([$field => $apiKey]);

        return back()->with('success', 'Clé API ' . ucfirst($provider) . ' configurée avec succès.');
    }

    public function removeApiKey(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|in:anthropic,openai',
        ]);

        $user = $request->user();
        $provider = $validated['provider'];
        $field = $provider === 'anthropic' ? 'anthropic_api_key' : 'openai_api_key';
        
        // Check if this is the only API key and user is in BYOK mode
        $otherField = $provider === 'anthropic' ? 'openai_api_key' : 'anthropic_api_key';
        
        if ($user->isLlmByokMode() && empty($user->$otherField)) {
            // Switch to credits mode if removing the last API key
            $user->update([
                $field => null,
                'llm_billing_mode' => 'credits',
            ]);
            return back()->with('success', 'Clé API supprimée. Mode de facturation passé en Crédits.');
        }

        $user->update([$field => null]);

        return back()->with('success', 'Clé API ' . ucfirst($provider) . ' supprimée.');
    }

    /**
     * Validate an API key by making a simple request
     */
    protected function validateApiKey(string $provider, string $apiKey): bool
    {
        try {
            if ($provider === 'anthropic') {
                // Test Anthropic API
                $response = Http::withHeaders([
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                ])->get('https://api.anthropic.com/v1/models');
                
                return $response->successful() || $response->status() === 200;
            } else {
                // Test OpenAI API
                $response = Http::withToken($apiKey)
                    ->get('https://api.openai.com/v1/models');
                
                return $response->successful();
            }
        } catch (\Exception $e) {
            return false;
        }
    }
}
