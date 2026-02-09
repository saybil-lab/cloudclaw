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
     * Servers are always managed by CloudClaw (using our Hetzner account)
     */
    public function createServer(User $user, string $name, string $serverType = 'cx22', string $datacenter = 'fsn1'): Server
    {
        // Check if user has enough credits for at least 1 month
        $monthlyPrice = $this->getMonthlyPrice($serverType);

        if (!$this->credits->hasEnoughCredits($user, $monthlyPrice)) {
            throw new \Exception('Crédits insuffisants. Veuillez ajouter au moins €' . number_format($monthlyPrice, 2) . ' à votre compte.');
        }

        // Create server record
        $server = Server::create([
            'user_id' => $user->id,
            'name' => $name,
            'server_type' => $serverType,
            'monthly_price' => $monthlyPrice,
            'datacenter' => $datacenter,
            'status' => 'pending',
            'provision_status' => 'pending',
        ]);

        try {
            // Create server on Hetzner (using CloudClaw's account)
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

            $server->appendProvisionLog('Assistant créé sur Hetzner');
            $server->appendProvisionLog('IP: ' . ($server->ip ?? 'en attente'));

            // Deduct first month payment
            $this->credits->deductCredits($user, $monthlyPrice, 'Création assistant: ' . $name, $server->id);

            // Dispatch provisioning job
            if ($rootPassword) {
                ProvisionServerJob::dispatch($server, $rootPassword)
                    ->delay(now()->addSeconds(30)); // Wait 30 seconds for server to boot
                
                $server->appendProvisionLog('Configuration automatique programmée');
            } else {
                $server->appendProvisionLog('Attention: Pas de mot de passe root, configuration manuelle requise');
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
     * Get the monthly price for a server type (in EUR)
     */
    public function getMonthlyPrice(string $serverType): float
    {
        $prices = [
            'cx22' => 4.99,
            'cx32' => 9.99,
            'cx42' => 19.99,
            'cx52' => 39.99,
        ];

        return $prices[$serverType] ?? 4.99;
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
                'monthly_price' => 4.99,
            ],
            [
                'name' => 'cx32',
                'label' => 'Confort',
                'description' => '4 cœurs, 8Go RAM, 80Go stockage',
                'monthly_price' => 9.99,
            ],
            [
                'name' => 'cx42',
                'label' => 'Performance',
                'description' => '8 cœurs, 16Go RAM, 160Go stockage',
                'monthly_price' => 19.99,
            ],
        ];
    }

    /**
     * Power on a server
     */
    public function powerOn(Server $server): bool
    {
        if ($server->hetzner_id) {
            return $this->hetzner->powerOn($server->hetzner_id);
        }
        return false;
    }

    /**
     * Power off a server
     */
    public function powerOff(Server $server): bool
    {
        if ($server->hetzner_id) {
            return $this->hetzner->powerOff($server->hetzner_id);
        }
        return false;
    }
}
