<?php

namespace App\Services;

use App\Jobs\ProvisionServerJob;
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
            'provision_status' => 'pending',
        ]);

        try {
            // Create server on Hetzner
            $result = $this->hetzner->createServer($server);

            // Update server with Hetzner details
            $hetznerServer = $result['server'];
            $rootPassword = $result['root_password'] ?? null;

            $server->update([
                'hetzner_id' => $hetznerServer['id'],
                'ip' => $hetznerServer['public_net']['ipv4']['ip'] ?? null,
                'status' => 'provisioning',
                'provision_status' => 'pending',
                'root_password' => $rootPassword,
                'specs' => [
                    'cores' => $hetznerServer['server_type']['cores'] ?? 2,
                    'memory' => $hetznerServer['server_type']['memory'] ?? 4,
                    'disk' => $hetznerServer['server_type']['disk'] ?? 40,
                ],
            ]);

            $server->appendProvisionLog('Server created on Hetzner');
            $server->appendProvisionLog('IP: ' . ($server->ip ?? 'pending'));

            // Deduct initial credit for server creation
            $this->credits->deductCredits($user, $hourlyRate, 'Server creation: ' . $name, $server->id);

            // Dispatch provisioning job
            if ($rootPassword) {
                ProvisionServerJob::dispatch($server, $rootPassword)
                    ->delay(now()->addSeconds(30)); // Wait 30 seconds for server to boot
                
                $server->appendProvisionLog('Provisioning job scheduled');
            } else {
                // If no root password (SSH key used), provision differently
                $server->appendProvisionLog('Warning: No root password available, manual provisioning required');
            }

            Log::info('Server creation initiated', [
                'server_id' => $server->id,
                'hetzner_id' => $server->hetzner_id,
                'user_id' => $user->id,
            ]);

            return $server->fresh();

        } catch (\Exception $e) {
            $server->update([
                'status' => 'error',
                'provision_status' => 'failed',
            ]);
            $server->appendProvisionLog('ERROR: ' . $e->getMessage());

            Log::error('Server provisioning failed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete a server
     */
    public function deleteServer(Server $server): bool
    {
        try {
            if ($server->hetzner_id) {
                $this->hetzner->deleteServer($server->hetzner_id);
            }

            // Delete email account if exists
            if ($server->email_address) {
                try {
                    $mailService = app(MailService::class);
                    $mailService->deleteMailbox($server->email_address);
                } catch (\Exception $e) {
                    Log::warning('Failed to delete mailbox', [
                        'server_id' => $server->id,
                        'email' => $server->email_address,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $server->update(['status' => 'deleted']);

            Log::info('Server deleted', ['server_id' => $server->id]);
            
            return true;

        } catch (\Exception $e) {
            Log::error('Failed to delete server', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
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

    /**
     * Check and charge hourly server costs
     * Should be called by a scheduler every hour
     */
    public function chargeHourlyServerCosts(): array
    {
        $results = [];

        $servers = Server::where('status', 'running')
            ->whereNotNull('hetzner_id')
            ->get();

        foreach ($servers as $server) {
            try {
                $rate = $this->getHourlyRate($server->server_type);
                $user = $server->user;

                if ($this->credits->hasEnoughCredits($user, $rate)) {
                    $this->credits->deductCredits(
                        $user,
                        $rate,
                        'Hourly charge: ' . $server->name,
                        $server->id
                    );
                    $results[$server->id] = 'charged';
                } else {
                    // Insufficient credits - stop the server
                    $this->hetzner->powerOff($server->hetzner_id);
                    $server->update(['status' => 'stopped']);
                    $server->appendProvisionLog('Server stopped: Insufficient credits');
                    $results[$server->id] = 'stopped_insufficient_credits';

                    // TODO: Send notification to user
                }
            } catch (\Exception $e) {
                Log::error('Error charging server', [
                    'server_id' => $server->id,
                    'error' => $e->getMessage(),
                ]);
                $results[$server->id] = 'error';
            }
        }

        return $results;
    }
}
