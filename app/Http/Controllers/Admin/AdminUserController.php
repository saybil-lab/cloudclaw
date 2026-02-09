<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CreditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function __construct(
        protected CreditService $creditService
    ) {}

    public function index(Request $request)
    {
        $query = User::withCount(['servers' => function ($q) {
            $q->whereNotIn('status', ['deleted']);
        }]);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(20);

        // Add credit balance to each user
        $users->through(function ($user) {
            $user->credit_balance = $this->creditService->getBalance($user);
            return $user;
        });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(User $user)
    {
        return Inertia::render('Admin/Users/Show', [
            'user' => $user->loadCount(['servers' => function ($q) {
                $q->whereNotIn('status', ['deleted']);
            }]),
            'servers' => $user->servers()->whereNotIn('status', ['deleted'])->get(),
            'creditBalance' => $this->creditService->getBalance($user),
            'transactions' => $this->creditService->getTransactions($user, 20),
        ]);
    }

    public function addCredits(Request $request, User $user)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:10000',
            'description' => 'nullable|string|max:255',
        ]);

        $this->creditService->addCredits(
            $user,
            (float) $validated['amount'],
            'bonus',
            $validated['description'] ?? 'Admin credit bonus'
        );

        return back()->with('success', 'Credits added successfully.');
    }

    public function toggleAdmin(User $user)
    {
        $user->update(['is_admin' => !$user->is_admin]);

        return back()->with('success', $user->is_admin ? 'User is now an admin.' : 'Admin rights removed.');
    }
}
