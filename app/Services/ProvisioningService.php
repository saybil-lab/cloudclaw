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
     * Get the appropriate HetznerService for a user (platform or BYOK)
     */
    protected function getHetznerService(User $user): HetznerService
    {
        if ($user->isByokMode() && $user->hetzner_token) {
            return HetznerService::withToken($user->hetzner_token);
        }
        return $this->hetzner;
    }

    /**
     * Create and provision a new server for a user
     */
    public function createServer(User $user, string $name, string $serverType = 'cx22', string $datacenter = 'fsn1'): Server
    {
        $billingMode = $user->billing_mode;

        // Check requirements based on billing mode
        if ($billingMode === 'credits') {
            $monthlyRate = $this->getMonthlyRate($serverType);
            $minimumCredits = $monthlyRate; // At least 1 month worth of credits

            if (!$this->credits->hasEnoughCredits($user, $minimumCredits)) {
                throw new \Exception('Crédits insuffisants. Veuillez ajouter au moins €' . number_format($minimumCredits, 2) . ' à votre compte.');
            }
        } else {
            // BYOK mode - check if user has configured their token
            if (!$user->hasByokConfigured()) {
                throw new \Exception('Veuillez configurer votre token Hetzner dans les paramètres avant de créer un assistant.');
            }
        }

        // Get the right Hetzner service
        $hetznerService = $this->getHetznerService($user);

        // Create server record
        $server = Server::create([
            'user_id' => $user->id,
            'billing_mode' => $billingMode,
            'name' => $name,
            'server_type' => $serverType,
            'datacenter' => $datacenter,
            'status' => 'pending',
            'provision_status' => 'pending',
        ]);

        try {
            // Create server on Hetzner
            $result = $hetznerService->createServer($server);

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

            $server->appendProvisionLog('Assistant créé sur Hetzner');
            $server->appendProvisionLog('IP: ' . ($server->ip ?? 'en attente'));

            // Deduct credits only in credits mode
            if ($billingMode === 'credits') {
                $monthlyRate = $this->getMonthlyRate($serverType);
                $this->credits->deductCredits($user, $monthlyRate, 'Création assistant: ' . $name, $server->id);
            }

            // Dispatch provisioning job
            if ($rootPassword) {
                ProvisionServerJob::dispatch($server, $rootPassword)
                    ->delay(now()->addSeconds(30)); // Wait 30 seconds for server to boot
                
                $server->appendProvisionLog('Configuration automatique programmée');
            } else {
                // If no root password (SSH key used), provision differently
                $server->appendProvisionLog('Attention: Pas de mot de passe root, configuration manuelle requise');
            }

            Log::info('Server creation initiated', [
                'server_id' => $server->id,
                'hetzner_id' => $server->hetzner_id,
                'user_id' => $user->id,
                'billing_mode' => $billingMode,
            ]);

            return $server->fresh();

        } catch (\Exception $e) {
            $server->update([
                'status' => 'error',
                'provision_status' => 'failed',
            ]);
            $server->appendProvisionLog('ERREUR: ' . $e->getMessage());

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
            // Get the right Hetzner service based on server's billing mode
            $hetznerService = $server->isByok() && $server->user->hetzner_token
                ? HetznerService::withToken($server->user->hetzner_token)
                : $this->hetzner;

            if ($server->hetzner_id) {
                $hetznerService->deleteServer($server->hetzner_id);
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
     * Get the monthly rate for a server type (in EUR)
     * Used for credits billing
     */
    public function getMonthlyRate(string $serverType): float
    {
        $rates = [
            'cx22' => 4.99,
            'cx32' => 9.99,
            'cx42' => 19.99,
            'cx52' => 39.99,
        ];

        return $rates[$serverType] ?? 4.99;
    }

    /**
     * Get available server types with pricing
     */
    public function getAvailableServerTypes(): array
    {
        return [
            [
                'name' => 'cx22',
                'label' => 'Essentiel',
                'description' => '2 cœurs, 4Go RAM, 40Go stockage',
                'monthly_rate' => 4.99,
                'hetzner_cost' => 3.29,
            ],
            [
                'name' => 'cx32',
                'label' => 'Confort',
                'description' => '4 cœurs, 8Go RAM, 80Go stockage',
                'monthly_rate' => 9.99,
                'hetzner_cost' => 6.59,
            ],
            [
                'name' => 'cx42',
                'label' => 'Performance',
                'description' => '8 cœurs, 16Go RAM, 160Go stockage',
                'monthly_rate' => 19.99,
                'hetzner_cost' => 13.19,
            ],
        ];
    }

    /**
     * Power on a server
     */
    public function powerOn(Server $server): bool
    {
        $hetznerService = $this->getHetznerServiceForServer($server);
        
        if ($server->hetzner_id) {
            return $hetznerService->powerOn($server->hetzner_id);
        }
        
        return false;
    }

    /**
     * Power off a server
     */
    public function powerOff(Server $server): bool
    {
        $hetznerService = $this->getHetznerServiceForServer($server);
        
        if ($server->hetzner_id) {
            return $hetznerService->powerOff($server->hetzner_id);
        }
        
        return false;
    }

    /**
     * Get the appropriate HetznerService for a server
     */
    protected function getHetznerServiceForServer(Server $server): HetznerService
    {
        if ($server->isByok() && $server->user->hetzner_token) {
            return HetznerService::withToken($server->user->hetzner_token);
        }
        return $this->hetzner;
    }
}
