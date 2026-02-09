<?php

namespace App\Services;

use App\Models\Server;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class ProvisioningService
{
    protected HetznerService $hetzner;
    protected CreditService $credits;

    public function __construct(HetznerService $hetzner, CreditService $credits)
    {
        $this->hetzner = $hetzner;
        $this->credits = $credits;
    }

    /**
     * Create and provision a new server for a user
     */
    public function createServer(User $user, string $name, string $serverType = 'cx22', string $datacenter = 'fsn1'): Server
    {
        // Check credits
        $hourlyRate = $this->getHourlyRate($serverType);
        $minimumCredits = $hourlyRate * 24; // At least 24h worth of credits

        if (!$this->credits->hasEnoughCredits($user, $minimumCredits)) {
            throw new \Exception('Insufficient credits. Please add at least €' . number_format($minimumCredits, 2) . ' to your account.');
        }

        // Create server record
        $server = Server::create([
            'user_id' => $user->id,
            'name' => $name,
            'server_type' => $serverType,
            'datacenter' => $datacenter,
            'status' => 'pending',
        ]);

        try {
            // Create server on Hetzner
            $result = $this->hetzner->createServer($server);

            // Update server with Hetzner details
            $hetznerServer = $result['server'];
            $server->update([
                'hetzner_id' => $hetznerServer['id'],
                'ip' => $hetznerServer['public_net']['ipv4']['ip'] ?? null,
                'status' => 'provisioning',
                'specs' => [
                    'cores' => $hetznerServer['server_type']['cores'] ?? 2,
                    'memory' => $hetznerServer['server_type']['memory'] ?? 4,
                    'disk' => $hetznerServer['server_type']['disk'] ?? 40,
                ],
            ]);

            // Deduct initial credit for server creation
            $this->credits->deductCredits($user, $hourlyRate, 'Server creation: ' . $name, $server->id);

            // Queue OpenClaw installation (in a real app, this would be a job)
            $this->installOpenClaw($server);

            return $server->fresh();
        } catch (\Exception $e) {
            $server->update(['status' => 'error']);
            Log::error('Server provisioning failed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Install OpenClaw on the server
     */
    public function installOpenClaw(Server $server): void
    {
        // In production, this would SSH into the server and run installation commands
        // For now, we'll simulate it
        
        if (config('services.hetzner.mock', true)) {
            // Simulate installation delay
            $server->update([
                'status' => 'running',
                'openclaw_installed' => true,
                'provisioned_at' => now(),
                'vnc_url' => "https://console.hetzner.cloud/servers/{$server->hetzner_id}/vnc",
            ]);
            return;
        }

        // Real installation would look something like:
        // 1. Wait for server to be ready
        // 2. SSH into server
        // 3. Run OpenClaw installation script
        // 4. Configure OpenClaw
        // 5. Update server status
    }

    /**
     * Delete a server
     */
    public function deleteServer(Server $server): bool
    {
        if ($server->hetzner_id) {
            $this->hetzner->deleteServer($server->hetzner_id);
        }

        $server->update(['status' => 'deleted']);
        
        return true;
    }

    /**
     * Get the hourly rate for a server type (in EUR)
     */
    public function getHourlyRate(string $serverType): float
    {
        $rates = [
            'cx22' => 0.0065,
            'cx32' => 0.013,
            'cx42' => 0.026,
            'cx52' => 0.052,
        ];

        return $rates[$serverType] ?? 0.0065;
    }

    /**
     * Get available server types with pricing
     */
    public function getAvailableServerTypes(): array
    {
        return [
            [
                'name' => 'cx22',
                'label' => 'Starter',
                'description' => '2 vCPU, 4GB RAM, 40GB SSD',
                'hourly_rate' => 0.0065,
                'monthly_estimate' => 4.68,
            ],
            [
                'name' => 'cx32',
                'label' => 'Standard',
                'description' => '4 vCPU, 8GB RAM, 80GB SSD',
                'hourly_rate' => 0.013,
                'monthly_estimate' => 9.36,
            ],
            [
                'name' => 'cx42',
                'label' => 'Performance',
                'description' => '8 vCPU, 16GB RAM, 160GB SSD',
                'hourly_rate' => 0.026,
                'monthly_estimate' => 18.72,
            ],
        ];
    }
}
