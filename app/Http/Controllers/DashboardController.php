<?php

namespace App\Http\Controllers;

use App\Services\CreditService;
use App\Services\ProvisioningService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        protected CreditService $creditService,
        protected ProvisioningService $provisioningService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        
        $assistants = $user->servers()
            ->whereNotIn('status', ['deleted'])
            ->orderBy('created_at', 'desc')
            ->get();

        $creditBalance = $this->creditService->getBalance($user);
        $recentTransactions = $this->creditService->getTransactions($user, 5);

        return Inertia::render('Dashboard', [
            'assistants' => $assistants,
            'creditBalance' => $creditBalance,
            'recentTransactions' => $recentTransactions,
            'serverTypes' => $this->provisioningService->getAvailableServerTypes(),
            'llmBillingMode' => $user->llm_billing_mode,
            'hasLlmApiKey' => $user->hasLlmApiKey(),
            'llmCredits' => (float) $user->llm_credits,
        ]);
    }
}
