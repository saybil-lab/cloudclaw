<?php

namespace App\Services;

use App\Models\Server;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class HetznerService
{
    protected string $apiToken;
    protected string $baseUrl = 'https://api.hetzner.cloud/v1';

    public function __construct()
    {
        $this->apiToken = config('services.hetzner.token', '');
    }

    protected function request(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withToken($this->apiToken)
            ->baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(60);
    }

    /**
     * Check if we're in mock mode
     */
    protected function isMockMode(): bool
    {
        return config('services.hetzner.mock', false) || empty($this->apiToken);
    }

    /**
     * Create a new server on Hetzner
     */
    public function createServer(Server $server, ?string $sshKeyName = null): array
    {
        if ($this->isMockMode()) {
            return $this->mockCreateServer($server);
        }

        $payload = [
            'name' => Str::slug($server->name) . '-' . $server->id,
            'server_type' => $server->server_type,
            'location' => $server->datacenter,
            'image' => $server->image,
            'start_after_create' => true,
            'labels' => [
                'cloudclaw' => 'true',
                'user_id' => (string) $server->user_id,
                'server_id' => (string) $server->id,
            ],
        ];

        // Add SSH keys if specified
        if ($sshKeyName) {
            $payload['ssh_keys'] = [$sshKeyName];
        }

        // Use cloud-init for initial setup
        $payload['user_data'] = $this->getCloudInitScript();

        $response = $this->request()->post('/servers', $payload);

        if ($response->failed()) {
            Log::error('Hetzner API error creating server', [
                'status' => $response->status(),
                'body' => $response->json(),
                'server_id' => $server->id,
            ]);
            throw new \Exception('Failed to create server: ' . ($response->json('error.message') ?? 'Unknown error'));
        }

        $data = $response->json();
        Log::info('Hetzner server created', [
            'hetzner_id' => $data['server']['id'] ?? null,
            'server_id' => $server->id,
        ]);

        return $data;
    }

    /**
     * Get server details from Hetzner
     */
    public function getServer(string $hetznerId): ?array
    {
        if ($this->isMockMode()) {
            return $this->mockGetServer($hetznerId);
        }

        $response = $this->request()->get("/servers/{$hetznerId}");

        if ($response->failed()) {
            Log::warning('Hetzner API error getting server', [
                'status' => $response->status(),
                'hetzner_id' => $hetznerId,
            ]);
            return null;
        }

        return $response->json('server');
    }

    /**
     * Delete a server on Hetzner
     */
    public function deleteServer(string $hetznerId): bool
    {
        if ($this->isMockMode()) {
            return true;
        }

        $response = $this->request()->delete("/servers/{$hetznerId}");

        if ($response->failed()) {
            Log::error('Hetzner API error deleting server', [
                'status' => $response->status(),
                'body' => $response->json(),
                'hetzner_id' => $hetznerId,
            ]);
            return false;
        }

        Log::info('Hetzner server deleted', ['hetzner_id' => $hetznerId]);
        return true;
    }

    /**
     * Power on a server
     */
    public function powerOn(string $hetznerId): bool
    {
        if ($this->isMockMode()) {
            return true;
        }

        $response = $this->request()->post("/servers/{$hetznerId}/actions/poweron");

        if ($response->failed()) {
            Log::error('Hetzner API error powering on server', [
                'status' => $response->status(),
                'hetzner_id' => $hetznerId,
            ]);
            return false;
        }

        return true;
    }

    /**
     * Power off a server
     */
    public function powerOff(string $hetznerId): bool
    {
        if ($this->isMockMode()) {
            return true;
        }

        $response = $this->request()->post("/servers/{$hetznerId}/actions/poweroff");

        if ($response->failed()) {
            Log::error('Hetzner API error powering off server', [
                'status' => $response->status(),
                'hetzner_id' => $hetznerId,
            ]);
            return false;
        }

        return true;
    }

    /**
     * Reboot a server
     */
    public function reboot(string $hetznerId): bool
    {
        if ($this->isMockMode()) {
            return true;
        }

        $response = $this->request()->post("/servers/{$hetznerId}/actions/reboot");

        return $response->successful();
    }

    /**
     * Get VNC console URL (Hetzner's built-in console)
     */
    public function getConsole(string $hetznerId): ?array
    {
        if ($this->isMockMode()) {
            return [
                'wss_url' => "wss://console.hetzner.cloud/servers/{$hetznerId}/vnc",
                'password' => 'mock-password',
            ];
        }

        $response = $this->request()->post("/servers/{$hetznerId}/actions/request_console");

        if ($response->failed()) {
            return null;
        }

        return [
            'wss_url' => $response->json('action.wss_url'),
            'password' => $response->json('action.password'),
        ];
    }

    /**
     * List all servers (optionally filtered by labels)
     */
    public function listServers(array $labels = []): array
    {
        if ($this->isMockMode()) {
            return [];
        }

        $params = [];
        if (!empty($labels)) {
            $labelSelector = implode(',', array_map(fn($k, $v) => "{$k}={$v}", array_keys($labels), $labels));
            $params['label_selector'] = $labelSelector;
        }

        $response = $this->request()->get('/servers', $params);

        if ($response->failed()) {
            return [];
        }

        return $response->json('servers', []);
    }

    /**
     * Get cloud-init script for initial server setup
     */
    protected function getCloudInitScript(): string
    {
        return <<<'CLOUD_INIT'
#cloud-config
package_update: true
package_upgrade: true
packages:
  - curl
  - git
  - htop
  - vim
  - ufw

runcmd:
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw allow 6080/tcp
  - ufw allow 5901/tcp
  - ufw --force enable
  - echo "CloudClaw server initialized" > /var/log/cloudclaw-init.log
CLOUD_INIT;
    }

    // Mock methods for development
    protected function mockCreateServer(Server $server): array
    {
        $mockId = 'mock-' . time() . '-' . $server->id;
        return [
            'server' => [
                'id' => $mockId,
                'name' => $server->name,
                'public_net' => [
                    'ipv4' => [
                        'ip' => '10.0.0.' . rand(1, 255),
                    ],
                    'ipv6' => [
                        'ip' => '2001:db8::' . dechex(rand(1, 65535)),
                    ],
                ],
                'status' => 'initializing',
                'server_type' => [
                    'name' => $server->server_type,
                    'description' => $this->getServerTypeDescription($server->server_type),
                    'cores' => $this->getServerTypeCores($server->server_type),
                    'memory' => $this->getServerTypeMemory($server->server_type),
                    'disk' => $this->getServerTypeDisk($server->server_type),
                ],
                'datacenter' => [
                    'name' => $server->datacenter,
                    'location' => [
                        'name' => $server->datacenter,
                    ],
                ],
                'image' => [
                    'name' => $server->image,
                ],
                'created' => now()->toIso8601String(),
            ],
            'root_password' => 'mock-root-' . Str::random(16),
        ];
    }

    protected function mockGetServer(string $hetznerId): array
    {
        return [
            'id' => $hetznerId,
            'name' => 'mock-server',
            'status' => 'running',
            'public_net' => [
                'ipv4' => ['ip' => '10.0.0.1'],
            ],
            'server_type' => [
                'name' => 'cx22',
                'cores' => 2,
                'memory' => 4,
                'disk' => 40,
            ],
        ];
    }

    protected function getServerTypeDescription(string $type): string
    {
        return match($type) {
            'cx22' => '2 vCPU, 4GB RAM, 40GB SSD',
            'cx32' => '4 vCPU, 8GB RAM, 80GB SSD',
            'cx42' => '8 vCPU, 16GB RAM, 160GB SSD',
            default => 'Unknown type',
        };
    }

    protected function getServerTypeCores(string $type): int
    {
        return match($type) {
            'cx22' => 2,
            'cx32' => 4,
            'cx42' => 8,
            default => 2,
        };
    }

    protected function getServerTypeMemory(string $type): int
    {
        return match($type) {
            'cx22' => 4,
            'cx32' => 8,
            'cx42' => 16,
            default => 4,
        };
    }

    protected function getServerTypeDisk(string $type): int
    {
        return match($type) {
            'cx22' => 40,
            'cx32' => 80,
            'cx42' => 160,
            default => 40,
        };
    }
}
