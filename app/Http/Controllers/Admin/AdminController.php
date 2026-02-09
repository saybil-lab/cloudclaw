<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditTransaction;
use App\Models\Server;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users' => User::count(),
            'total_servers' => Server::whereNotIn('status', ['deleted'])->count(),
            'running_servers' => Server::where('status', 'running')->count(),
            'total_revenue' => CreditTransaction::where('type', 'purchase')->sum('amount'),
        ];

        $recentUsers = User::latest()->limit(5)->get();
        $recentServers = Server::with('user')->latest()->limit(5)->get();
        $recentTransactions = CreditTransaction::with('user')
            ->where('type', 'purchase')
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'recentServers' => $recentServers,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}
