<?php

namespace App\Jobs;

use App\Models\Server;
use App\Services\DockerDeploymentService;
use App\Services\HetznerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class CheckServerStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 3;

    protected ?int $serverId;

    /**
     * Create a new job instance.
     * If serverId is null, check all active servers.
     */
    public function __construct(?int $serverId = null)
    {
        $this->serverId = $serverId;
    }

    /**
     * Execute the job.
     */
    public function handle(HetznerService $hetzner): void
    {
        if ($this->serverId) {
            $server = Server::find($this->serverId);
            if ($server) {
                if ($server->isDocker()) {
                    $this->checkDockerServer($server);
                } else {
                    $this->checkServer($server, $hetzner);
                }
            }
        } else {
            // Check VM servers
            $vmServers = Server::whereNotIn('status', ['deleted', 'error'])
                ->whereNotNull('hetzner_id')
                ->get();

            foreach ($vmServers as $server) {
                $this->checkServer($server, $hetzner);
            }

            // Check Docker containers
            $dockerServers = Server::whereNotIn('status', ['deleted', 'error'])
                ->where('deployment_type', 'docker')
                ->whereNotNull('container_name')
                ->get();

            foreach ($dockerServers as $server) {
                $this->checkDockerServer($server);
            }
        }
    }

    protected function checkDockerServer(Server $server): void
    {
        Log::debug('Checking Docker container status', ['server_id' => $server->id]);

        try {
            $containerStatus = app(DockerDeploymentService::class)->getContainerStatus($server);

            $newStatus = match ($containerStatus) {
                'running' => 'running',
                'exited', 'dead', 'created', 'paused' => 'stopped',
                'not_found' => 'error',
                default => $server->status,
            };

            if ($newStatus !== $server->status) {
                $server->update(['status' => $newStatus]);
                Log::info('Docker container status updated', [
                    'server_id' => $server->id,
                    'old_status' => $server->status,
                    'new_status' => $newStatus,
                    'container_status' => $containerStatus,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error checking Docker container status', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check a single server's status
     */
    protected function checkServer(Server $server, HetznerService $hetzner): void
    {
        Log::debug('Checking server status', ['server_id' => $server->id]);

        try {
            // 1. Check Hetzner API status
            $hetznerStatus = $this->checkHetznerStatus($server, $hetzner);

            // 2. Check if server is reachable (ping/SSH)
            $isReachable = $this->checkServerReachability($server);

            // 3. Check if VNC is running
            $vncRunning = $this->checkVncStatus($server);

            // 4. Update server status
            $this->updateServerStatus($server, $hetznerStatus, $isReachable, $vncRunning);

        } catch (\Exception $e) {
            Log::error('Error checking server status', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check server status via Hetzner API
     */
    protected function checkHetznerStatus(Server $server, HetznerService $hetzner): ?string
    {
        if (!$server->hetzner_id) {
            return null;
        }

        $hetznerServer = $hetzner->getServer($server->hetzner_id);

        if (!$hetznerServer) {
            return null;
        }

        // Update IP if it changed
        $ip = $hetznerServer['public_net']['ipv4']['ip'] ?? null;
        if ($ip && $ip !== $server->ip) {
            $server->update(['ip' => $ip]);
        }

        return $hetznerServer['status'] ?? null;
    }

    /**
     * Check if the server is reachable via network
     */
    protected function checkServerReachability(Server $server): bool
    {
        if (!$server->ip) {
            return false;
        }

        // Try to ping the server
        $result = Process::timeout(5)
            ->run("ping -c 1 -W 3 {$server->ip}");

        return $result->successful();
    }

    /**
     * Check if VNC is running on the server
     */
    protected function checkVncStatus(Server $server): bool
    {
        if (!$server->ip) {
            return false;
        }

        // Check if port 6080 (noVNC) is open
        $result = Process::timeout(5)
            ->run("nc -z -w 3 {$server->ip} 6080");

        return $result->successful();
    }

    /**
     * Update the server status based on checks
     */
    protected function updateServerStatus(Server $server, ?string $hetznerStatus, bool $isReachable, bool $vncRunning): void
    {
        $updates = [];
        $statusChanged = false;

        // Map Hetzner status to our status
        if ($hetznerStatus) {
            $newStatus = match($hetznerStatus) {
                'running' => 'running',
                'off' => 'stopped',
                'initializing', 'starting' => 'provisioning',
                'stopping', 'deleting' => 'stopped',
                default => $server->status,
            };

            if ($newStatus !== $server->status) {
                $updates['status'] = $newStatus;
                $statusChanged = true;
            }
        }

        // If server is supposed to be running but not reachable
        if ($server->status === 'running' && !$isReachable && $server->provision_status === 'ready') {
            // Don't change status immediately, might be temporary
            Log::warning('Server not reachable', [
                'server_id' => $server->id,
                'ip' => $server->ip,
            ]);
        }

        // Update provision status if VNC is running and server is reachable
        if ($server->provision_status === 'provisioning' && $isReachable && $vncRunning) {
            $updates['provision_status'] = 'ready';
            $updates['openclaw_installed'] = true;
            $updates['provisioned_at'] = now();
            $statusChanged = true;
        }

        if (!empty($updates)) {
            $server->update($updates);
            
            Log::info('Server status updated', [
                'server_id' => $server->id,
                'updates' => $updates,
            ]);
        }
    }
}
