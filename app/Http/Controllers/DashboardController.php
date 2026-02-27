<?php

namespace App\Http\Controllers;

use App\Services\DockerDeploymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $server = $user->servers()->whereNotIn('status', ['deleted'])->latest()->first();
        $tiers = config('services.stripe.tiers', []);
        $currentTier = $user->subscription_tier ?? 'starter';

        return Inertia::render('Dashboard', [
            'hasActiveSubscription' => $user->hasActiveSubscription(),
            'subscriptionTier' => $currentTier,
            'llmCredits' => (float) $user->llm_credits,
            'tierCredits' => $tiers[$currentTier]['credits'] ?? 14,
            'tierPrice' => $tiers[$currentTier]['price'] ?? 9,
            'assistant' => $server ? [
                'id' => $server->id,
                'name' => $server->name,
                'status' => $server->status,
                'provision_status' => $server->provision_status,
                'provision_log' => $server->provision_log,
                'bot_username' => $server->bot_username,
                'telegram_url' => $server->bot_username ? "https://t.me/{$server->bot_username}" : null,
                'created_at' => $server->created_at->toISOString(),
            ] : null,
            'tiers' => collect($tiers)->map(fn($t, $k) => [
                'name' => $k,
                'price' => $t['price'],
                'credits' => $t['credits'],
            ])->values(),
        ]);
    }

    /**
     * AJAX polling endpoint for assistant status
     */
    public function status(Request $request)
    {
        $server = $request->user()->servers()->whereNotIn('status', ['deleted'])->latest()->first();

        if (!$server) {
            return response()->json(['status' => 'none']);
        }

        return response()->json([
            'id' => $server->id,
            'name' => $server->name,
            'status' => $server->status,
            'provision_status' => $server->provision_status,
            'provision_log' => $server->provision_log,
            'bot_username' => $server->bot_username,
            'telegram_url' => $server->bot_username ? "https://t.me/{$server->bot_username}" : null,
        ]);
    }

    /**
     * Delete the user's assistant
     */
    public function destroyAssistant(Request $request)
    {
        $server = $request->user()->servers()->whereNotIn('status', ['deleted'])->latest()->first();

        if (!$server) {
            return back()->withErrors(['error' => 'No assistant found.']);
        }

        try {
            if ($server->isDocker()) {
                app(DockerDeploymentService::class)->deleteContainer($server);
            } else {
                $server->update(['status' => 'deleted']);
            }
            return redirect()->route('dashboard')->with('success', 'Assistant deleted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
