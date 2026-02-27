<?php

namespace App\Http\Controllers;

use App\Models\Server;
use App\Services\DockerDeploymentService;
use App\Services\HetznerDeploymentService;
use App\Services\HetznerService;
use App\Services\ProvisioningService;
use App\Services\CreditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServerController extends Controller
{
    public function __construct(
        protected ProvisioningService $provisioningService,
        protected HetznerService $hetznerService,
        protected HetznerDeploymentService $deploymentService,
        protected CreditService $creditService
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
            'hasLlmApiKey' => $user->hasLlmApiKey(),
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Assistants/Create', [
            'creditBalance' => $user->getOrCreateCredit()->balance,
            'hasActiveSubscription' => $user->hasActiveSubscription(),
            'hasLlmApiKey' => $user->hasLlmApiKey(),
            'llmBillingMode' => $user->llm_billing_mode,
            'llmCredits' => (float) $user->llm_credits,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|regex:/^[a-zA-Z0-9-]+$/',
            'telegram_token' => 'required|string',
        ]);

        $user = $request->user();

        // 1. Must have active subscription
        if (!$user->hasActiveSubscription()) {
            return response()->json([
                'error' => 'An active subscription is required to create an assistant.',
                'requires_subscription' => true,
            ], 403);
        }

        // 2. Must have enough server credits
        $useDocker = config('services.docker.enabled');
        $serverPrice = $useDocker ? 1.99 : 9.99;
        $credit = $user->getOrCreateCredit();
        if ($credit->balance < $serverPrice) {
            return response()->json([
                'error' => 'Insufficient server credits. You need at least $' . number_format($serverPrice, 2) . '.',
                'type' => 'insufficient_server_credits',
            ], 422);
        }

        // 3. If using platform LLM credits, must have some balance
        if ($user->llm_billing_mode === 'credits' && $user->llm_credits <= 0 && !$user->hasLlmApiKey()) {
            return response()->json([
                'error' => 'You need AI credits to use your assistant. Please add AI credits or configure your own API key.',
                'type' => 'insufficient_llm_credits',
            ], 422);
        }

        try {
            // Deduct server credits
            $this->creditService->deductCredits(
                $user,
                $serverPrice,
                'Assistant creation: ' . $validated['name']
            );

            // Deploy via Docker (fast, synchronous) or Hetzner VM (slow, background job)
            if ($useDocker) {
                $server = app(DockerDeploymentService::class)->deploy(
                    $user,
                    $validated['telegram_token'],
                    $validated['name']
                );
            } else {
                $server = $this->deploymentService->deployOpenClaw(
                    $user,
                    $validated['telegram_token'],
                    $validated['name']
                );
            }

            return response()->json([
                'status' => 'success',
                'server_id' => $server->id,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
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
            'hasLlmApiKey' => $user->hasLlmApiKey(),
        ]);
    }

    public function destroy(Request $request, Server $server)
    {
        // Ensure user owns this server
        if ($server->user_id !== $request->user()->id) {
            abort(403);
        }

        try {
            if ($server->isDocker()) {
                app(DockerDeploymentService::class)->deleteContainer($server);
            } else {
                $this->deploymentService->deleteServer($server);
            }
            return redirect()->route('assistants.index')
                ->with('success', 'Assistant deleted successfully.');
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

            return back()->with('success', $action === 'on' ? 'Assistant started.' : 'Assistant stopped.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function status(Request $request, Server $server)
    {
        if ($server->user_id !== $request->user()->id) {
            abort(403);
        }

        return response()->json([
            'status' => $server->provision_status,
            'logs' => $server->provision_log,
        ]);
    }
}
