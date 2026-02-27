<?php

namespace App\Services;

use App\Models\Server;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class HetznerDeploymentService
{
    protected string $apiToken;
    protected string $baseUrl = 'https://api.hetzner.cloud/v1';
    protected SshKeyService $sshKeyService;
    protected SshService $sshService;

    public function __construct(SshKeyService $sshKeyService, SshService $sshService)
    {
        $this->apiToken = config('services.hetzner.token') ?? '';
        $this->sshKeyService = $sshKeyService;
        $this->sshService = $sshService;
    }

    protected function request(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withToken($this->apiToken)
            ->baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(60);
    }

    protected function isMockMode(): bool
    {
        return config('services.hetzner.mock', false) || empty($this->apiToken);
    }

    /**
     * Create and provision a new OpenClaw server for a user
     */
    public function deployOpenClaw(User $user, string $telegramToken, ?string $name = null): Server
    {
        if (!$user->hasActiveSubscription()) {
            throw new \Exception('An active subscription is required to deploy.');
        }

        if (!$name) {
            $name = 'openclaw-' . Str::slug($user->name) . '-' . Str::random(4);
        }

        $serverType = 'cpx22';
        $datacenter = 'hel1';

        // Create server record in provisioning state
        $server = Server::create([
            'user_id' => $user->id,
            'name' => $name,
            'server_type' => $serverType,
            'datacenter' => $datacenter,
            'monthly_price' => 9.99,
            'status' => 'provisioning',
            'provision_status' => 'pending',
            'image' => $this->getImageId(),
            'telegram_token' => $telegramToken,
        ]);

        try {
            $result = $this->createHetznerServer($server, $telegramToken);

            $hetznerServer = $result['server'];

            $server->update([
                'hetzner_id' => $hetznerServer['id'],
                'ip' => $hetznerServer['public_net']['ipv4']['ip'] ?? null,
                'status' => 'provisioning',
                'provision_status' => 'provisioning',
                'specs' => [
                    'cores' => 2,
                    'memory' => 4,
                    'disk' => 80,
                ],
            ]);

            // Save root password if returned (only when no SSH key is used)
            if (isset($result['root_password'])) {
                $server->update(['root_password' => $result['root_password']]);
            }

            $server->appendProvisionLog("Server created on Hetzner (ID: {$hetznerServer['id']})");

            Log::info('OpenClaw deployment initiated', [
                'server_id' => $server->id,
                'hetzner_id' => $server->hetzner_id,
                'user_id' => $user->id,
            ]);
            // 4. Trigger background installation job
            \App\Jobs\InstallOpenClawJob::dispatch($server, $telegramToken);

            return $server->fresh();

        } catch (\Exception $e) {
            $server->update([
                'status' => 'error',
                'provision_status' => 'failed',
            ]);
            $server->appendProvisionLog('ERROR: ' . $e->getMessage());

            Log::error('OpenClaw deployment failed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    protected function createHetznerServer(Server $server, string $telegramToken): array
    {
        if ($this->isMockMode()) {
            return $this->mockCreateServer($server);
        }

        // Ensure the CloudClaw SSH key is uploaded to Hetzner
        $sshKeyId = $this->ensureHetznerSshKey();

        $payload = [
            'name' => $server->name,
            'server_type' => $server->server_type,
            'location' => $server->datacenter,
            'image' => $server->image ?? 'ubuntu-24.04',
            'start_after_create' => true,
            'labels' => [
                'cloudclaw' => 'true',
                'openclaw' => 'true',
                'user_id' => (string) $server->user_id,
                'server_id' => (string) $server->id,
            ],
            'user_data' => $this->getCloudInitScript($server, $telegramToken),
        ];

        // Attach the SSH key so we can connect later
        if ($sshKeyId) {
            $payload['ssh_keys'] = [$sshKeyId];
        }

        $response = $this->request()->post('/servers', $payload);

        if ($response->failed()) {
            Log::error('Hetzner API error creating server', [
                'status' => $response->status(),
                'body' => $response->json(),
                'server_id' => $server->id,
            ]);
            throw new \Exception('Failed to create server: ' . ($response->json('error.message') ?? 'Unknown error'));
        }

        return $response->json();
    }

    /**
     * Ensure the CloudClaw SSH public key is uploaded to Hetzner.
     * Returns the Hetzner SSH key ID (int), or null on failure.
     */
    protected function ensureHetznerSshKey(): ?int
    {
        try {
            $publicKey = $this->sshKeyService->getPublicKey();
            $keyName = 'cloudclaw-server';

            // Check if we already uploaded this key
            $response = $this->request()->get('/ssh_keys', ['name' => $keyName]);

            if ($response->successful()) {
                $existing = collect($response->json('ssh_keys', []))
                    ->firstWhere('name', $keyName);

                if ($existing) {
                    return $existing['id'];
                }
            }

            // Upload the key
            $response = $this->request()->post('/ssh_keys', [
                'name' => $keyName,
                'public_key' => $publicKey,
            ]);

            if ($response->successful()) {
                $keyId = $response->json('ssh_key.id');
                Log::info('CloudClaw SSH key uploaded to Hetzner', ['key_id' => $keyId]);
                return $keyId;
            }

            Log::warning('Failed to upload SSH key to Hetzner', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
        } catch (\Exception $e) {
            Log::warning('SSH key upload failed', ['error' => $e->getMessage()]);
        }

        return null;
    }
    /**
     * Get the real-time deployment progress.
     * With background jobs, this just returns the server's current status and provision_log
     * from the database directly, without any slow HTTP/SSH polls.
     */
    public function getDeploymentProgress(Server $server): array
    {
        if ($this->isMockMode()) {
            return ['status' => 'running', 'logs' => "Mock deployment complete.\nServer is ready."];
        }

        $status = $server->status; // 'initializing', 'provisioning', 'running', 'error'
        $logs = $server->provision_log ?? "Initializing server...";

        return [
            'status' => $status === 'running' ? 'done' : 'provisioning',
            'logs' => $logs,
        ];
    }

    /**
     * Get the image ID to use for server creation.
     * Returns snapshot ID (int) if configured, otherwise falls back to 'ubuntu-24.04'.
     */
    protected function getImageId(): int|string
    {
        $snapshotId = config('services.hetzner.snapshot_id');

        return $snapshotId ? (int) $snapshotId : 'ubuntu-24.04';
    }

    /**
     * Whether we're deploying from a pre-baked snapshot (vs bare Ubuntu).
     */
    protected function isSnapshotDeploy(): bool
    {
        return !empty(config('services.hetzner.snapshot_id'));
    }

    /**
     * Cloud-init script. Keeps it simple — just adds the SSH key.
     * All config is done via SSH after boot.
     */
    protected function getCloudInitScript(Server $server, string $telegramToken): string
    {
        $publicKey = $this->sshKeyService->getPublicKey();

        if ($this->isSnapshotDeploy()) {
            return <<<CLOUD_INIT
#cloud-config
ssh_authorized_keys:
  - {$publicKey}
CLOUD_INIT;
        }

        return <<<CLOUD_INIT
#cloud-config
package_update: true
package_upgrade: true

ssh_authorized_keys:
  - {$publicKey}

runcmd:
  - touch /var/log/cloudclaw_ready
CLOUD_INIT;
    }

    protected function mockCreateServer(Server $server): array
    {
        $mockId = 'mock-' . time() . '-' . $server->id;
        return [
            'server' => [
                'id' => $mockId,
                'name' => $server->name,
                'public_net' => [
                    'ipv4' => ['ip' => '10.0.0.' . rand(1, 255)],
                    'ipv6' => ['ip' => '2001:db8::1'],
                ],
                'status' => 'initializing',
                'server_type' => ['name' => $server->server_type],
                'datacenter' => ['name' => $server->datacenter],
                'image' => ['name' => 'ubuntu-24.04'],
                'created' => now()->toIso8601String(),
            ],
        ];
    }

    public function deleteServer(Server $server): bool
    {
        try {
            if ($server->hetzner_id && !Str::startsWith($server->hetzner_id, 'mock-')) {
                if (!$this->isMockMode()) {
                    $response = $this->request()->delete("/servers/{$server->hetzner_id}");
                    if ($response->failed() && $response->status() !== 404) {
                        Log::error('Hetzner API error deleting server', [
                            'status' => $response->status(),
                            'body' => $response->json(),
                            'hetzner_id' => $server->hetzner_id,
                        ]);
                        throw new \Exception('Failed to delete server from Hetzner: ' . $response->body());
                    }
                }
            }

            $server->update(['status' => 'deleted']);
            Log::info('OpenClaw server deleted', ['server_id' => $server->id]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete OpenClaw server', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
