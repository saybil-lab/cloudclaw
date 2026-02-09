<?php

namespace App\Http\Controllers;

use App\Models\Server;
use App\Services\HetznerService;
use App\Services\ProvisioningService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServerController extends Controller
{
    public function __construct(
        protected ProvisioningService $provisioningService,
        protected HetznerService $hetznerService
    ) {}

    public function index(Request $request)
    {
        $servers = $request->user()
            ->servers()
            ->whereNotIn('status', ['deleted'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Servers/Index', [
            'servers' => $servers,
            'serverTypes' => $this->provisioningService->getAvailableServerTypes(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Servers/Create', [
            'serverTypes' => $this->provisioningService->getAvailableServerTypes(),
            'datacenters' => [
                ['id' => 'fsn1', 'name' => 'Falkenstein, Germany'],
                ['id' => 'nbg1', 'name' => 'Nuremberg, Germany'],
                ['id' => 'hel1', 'name' => 'Helsinki, Finland'],
                ['id' => 'ash', 'name' => 'Ashburn, USA'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|regex:/^[a-zA-Z0-9-]+$/',
            'server_type' => 'required|string|in:cx22,cx32,cx42',
            'datacenter' => 'required|string|in:fsn1,nbg1,hel1,ash',
        ]);

        try {
            $server = $this->provisioningService->createServer(
                $request->user(),
                $validated['name'],
                $validated['server_type'],
                $validated['datacenter']
            );

            return redirect()->route('servers.show', $server)
                ->with('success', 'Server is being provisioned. This may take a few minutes.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(Request $request, Server $server)
    {
        // Ensure user owns this server
        if ($server->user_id !== $request->user()->id) {
            abort(403);
        }

        return Inertia::render('Servers/Show', [
            'server' => $server,
        ]);
    }

    public function destroy(Request $request, Server $server)
    {
        // Ensure user owns this server
        if ($server->user_id !== $request->user()->id) {
            abort(403);
        }

        try {
            $this->provisioningService->deleteServer($server);
            return redirect()->route('servers.index')
                ->with('success', 'Server deleted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function power(Request $request, Server $server)
    {
        if ($server->user_id !== $request->user()->id) {
            abort(403);
        }

        $action = $request->input('action');

        try {
            if ($action === 'on') {
                $this->hetznerService->powerOn($server->hetzner_id);
                $server->update(['status' => 'running']);
            } elseif ($action === 'off') {
                $this->hetznerService->powerOff($server->hetzner_id);
                $server->update(['status' => 'stopped']);
            }

            return back()->with('success', 'Server power ' . $action . ' initiated.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
