<?php

namespace App\Http\Controllers;

use App\Models\Server;
use App\Services\HetznerDeploymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DeploymentController extends Controller
{
    protected HetznerDeploymentService $deploymentService;

    public function __construct(HetznerDeploymentService $deploymentService)
    {
        $this->deploymentService = $deploymentService;
    }

    /**
     * Deploy a new OpenClaw instance
     */
    public function store(Request $request)
    {
        $request->validate([
            'channel' => 'required|string|in:telegram',
            'telegram_token' => 'required|string',
        ]);

        $user = $request->user();

        // If not subscribed, redirect them or return an error?
        // Let DeployAssistant handle it.
        if (!$user->hasActiveSubscription()) {
            return response()->json([
                'error' => 'A user subscription is required to deploy a new server.',
                'requires_subscription' => true,
            ], 403);
        }

        try {
            $server = $this->deploymentService->deployOpenClaw($user, $request->telegram_token);
            
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

    /**
     * Get the deployment status
     */
    public function status(Request $request, Server $server)
    {
        if ($server->user_id !== $request->user()->id) {
            abort(403);
        }

        $progress = $this->deploymentService->getDeploymentProgress($server);

        return response()->json([
            'status' => $progress['status'],
            'logs' => $progress['logs'],
        ]);
    }
}
