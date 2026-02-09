<?php

namespace App\Http\Controllers;

use App\Services\HetznerService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        return Inertia::render('Settings/Index', [
            'billingMode' => $user->billing_mode,
            'hasHetznerToken' => !empty($user->hetzner_token),
            'creditBalance' => $user->getOrCreateCredit()->balance,
        ]);
    }

    public function updateBillingMode(Request $request)
    {
        $validated = $request->validate([
            'billing_mode' => 'required|in:credits,byok',
        ]);

        $user = $request->user();
        
        // If switching to BYOK, check if token is configured
        if ($validated['billing_mode'] === 'byok' && empty($user->hetzner_token)) {
            return back()->withErrors(['error' => 'Veuillez d\'abord configurer votre token Hetzner.']);
        }

        $user->update(['billing_mode' => $validated['billing_mode']]);

        return back()->with('success', 'Mode de facturation mis à jour.');
    }

    public function updateHetznerToken(Request $request)
    {
        $validated = $request->validate([
            'hetzner_token' => 'required|string|min:10',
        ]);

        // Validate the token
        $hetznerService = HetznerService::withToken($validated['hetzner_token']);
        
        if (!$hetznerService->validateToken()) {
            return back()->withErrors(['hetzner_token' => 'Token Hetzner invalide. Veuillez vérifier votre token.']);
        }

        $request->user()->update([
            'hetzner_token' => $validated['hetzner_token'],
        ]);

        return back()->with('success', 'Token Hetzner configuré avec succès.');
    }

    public function removeHetznerToken(Request $request)
    {
        $user = $request->user();
        
        // If user is in BYOK mode and has active servers, don't allow removal
        if ($user->isByokMode()) {
            $activeServers = $user->servers()
                ->where('billing_mode', 'byok')
                ->whereNotIn('status', ['deleted'])
                ->count();
            
            if ($activeServers > 0) {
                return back()->withErrors(['error' => 'Vous avez encore des assistants actifs en mode BYOK. Supprimez-les d\'abord ou passez en mode Crédits.']);
            }
        }

        $user->update([
            'hetzner_token' => null,
            'billing_mode' => 'credits',
        ]);

        return back()->with('success', 'Token Hetzner supprimé. Mode de facturation passé en Crédits.');
    }
}
