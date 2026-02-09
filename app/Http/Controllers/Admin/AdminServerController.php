<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Services\ProvisioningService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminServerController extends Controller
{
    public function __construct(
        protected ProvisioningService $provisioningService
    ) {}

    public function index(Request $request)
    {
        $query = Server::with('user')->whereNotIn('status', ['deleted']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('ip', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $servers = $query->latest()->paginate(20);

        return Inertia::render('Admin/Servers/Index', [
            'servers' => $servers,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function show(Server $server)
    {
        return Inertia::render('Admin/Servers/Show', [
            'server' => $server->load('user'),
        ]);
    }

    public function destroy(Server $server)
    {
        try {
            $this->provisioningService->deleteServer($server);
            return redirect()->route('admin.servers.index')
                ->with('success', 'Server deleted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
