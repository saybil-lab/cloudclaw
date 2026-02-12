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
        $user = $request->user();
        $servers = $user->servers()
            ->whereNotIn('status', ['deleted'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Assistants/Index', [
            'assistants' => $servers,
            'serverTypes' => $this->provisioningService->getAvailableServerTypes(),
            'hasActiveSubscription' => $user->hasActiveSubscription(),
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Assistants/Create', [
            'serverTypes' => $this->provisioningService->getAvailableServerTypes(),
            'locations' => [
                ['id' => 'fsn1', 'name' => 'Allemagne (Falkenstein)', 'flag' => '🇩🇪'],
                ['id' => 'nbg1', 'name' => 'Allemagne (Nuremberg)', 'flag' => '🇩🇪'],
                ['id' => 'hel1', 'name' => 'Finlande (Helsinki)', 'flag' => '🇫🇮'],
                ['id' => 'ash', 'name' => 'États-Unis (Ashburn)', 'flag' => '🇺🇸'],
            ],
            'creditBalance' => $user->getOrCreateCredit()->balance,
            'hasActiveSubscription' => $user->hasActiveSubscription(),
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

            return redirect()->route('assistants.show', $server)
                ->with('success', 'Votre assistant est en cours de création. Cela peut prendre quelques minutes.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(Request $request, Server $server)
    {
        $user = $request->user();

        // Ensure user owns this server
        if ($server->user_id !== $user->id) {
            abort(403);
        }

        // Make sensitive fields visible for the owner
        $serverData = $server->toArray();
        $serverData['vnc_password'] = $server->vnc_password;
        $serverData['email_password'] = $server->email_password;

        return Inertia::render('Assistants/Show', [
            'assistant' => $serverData,
            'hasActiveSubscription' => $user->hasActiveSubscription(),
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
            return redirect()->route('assistants.index')
                ->with('success', 'Assistant supprimé avec succès.');
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
                $this->provisioningService->powerOn($server);
                $server->update(['status' => 'running']);
            } elseif ($action === 'off') {
                $this->provisioningService->powerOff($server);
                $server->update(['status' => 'stopped']);
            }

            return back()->with('success', $action === 'on' ? 'Assistant démarré.' : 'Assistant arrêté.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
