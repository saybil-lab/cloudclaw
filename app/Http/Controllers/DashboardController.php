<?php

namespace App\Http\Controllers;

use App\Services\CreditService;
use App\Services\ProvisioningService;
use Carbon\Carbon;
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

        // Calculate stats
        $activeAssistants = $assistants->where('status', 'running')->count();
        $totalAssistants = $assistants->count();

        // Calculate usage from transactions
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        $usageToday = abs($user->creditTransactions()
            ->where('type', 'debit')
            ->whereDate('created_at', $today)
            ->sum('amount'));

        $usageThisMonth = abs($user->creditTransactions()
            ->where('type', 'debit')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('amount'));

        $stats = [
            'total_assistants' => $totalAssistants,
            'active_assistants' => $activeAssistants,
            'total_credits' => $creditBalance,
            'llm_credits' => (float) $user->llm_credits,
            'usage_today' => $usageToday,
            'usage_this_month' => $usageThisMonth,
        ];

        // Generate chart data for last 7 days
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $usage = abs($user->creditTransactions()
                ->where('type', 'debit')
                ->whereDate('created_at', $date)
                ->sum('amount'));

            $chartData[] = [
                'date' => $date->format('D'),
                'fullDate' => $date->format('M d, Y'),
                'usage' => (float) $usage,
            ];
        }

        // Get recent activity (placeholder - you can create an ActivityLog model later)
        $recentActivity = [];

        return Inertia::render('Dashboard', [
            'assistants' => $assistants,
            'stats' => $stats,
            'chartData' => $chartData,
            'recentActivity' => $recentActivity,
            'recentTransactions' => $recentTransactions,
            'llmBillingMode' => $user->llm_billing_mode,
            'hasLlmApiKey' => $user->hasLlmApiKey(),
            'hasActiveSubscription' => $user->hasActiveSubscription(),
            'subscriptionStatus' => $user->subscription_status,
        ]);
    }
}
