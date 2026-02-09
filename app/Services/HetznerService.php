<?php

namespace App\Services;

use App\Models\Server;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
            ->acceptJson();
    }

    /**
     * Create a new server on Hetzner
     */
    public function createServer(Server $server, string $sshKeyName = null): array
    {
        $payload = [
            'name' => $server->name,
            'server_type' => $server->server_type,
            'location' => $server->datacenter,
            'image' => $server->image,
            'start_after_create' => true,
        ];

        if ($sshKeyName) {
            $payload['ssh_keys'] = [$sshKeyName];
        }

        // In development/mock mode, return fake data
        if (config('services.hetzner.mock', true)) {
            return $this->mockCreateServer($server);
        }

        $response = $this->request()->post('/servers', $payload);

        if ($response->failed()) {
            Log::error('Hetzner API error', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            throw new \Exception('Failed to create server: ' . $response->json('error.message', 'Unknown error'));
        }

        return $response->json();
    }

    /**
     * Get server details from Hetzner
     */
    public function getServer(string $hetznerId): ?array
    {
        if (config('services.hetzner.mock', true)) {
            return $this->mockGetServer($hetznerId);
        }

        $response = $this->request()->get("/servers/{$hetznerId}");

        if ($response->failed()) {
            return null;
        }

        return $response->json('server');
    }

    /**
     * Delete a server on Hetzner
     */
    public function deleteServer(string $hetznerId): bool
    {
        if (config('services.hetzner.mock', true)) {
            return true;
        }

        $response = $this->request()->delete("/servers/{$hetznerId}");

        return $response->successful();
    }

    /**
     * Power on a server
     */
    public function powerOn(string $hetznerId): bool
    {
        if (config('services.hetzner.mock', true)) {
            return true;
        }

        $response = $this->request()->post("/servers/{$hetznerId}/actions/poweron");

        return $response->successful();
    }

    /**
     * Power off a server
     */
    public function powerOff(string $hetznerId): bool
    {
        if (config('services.hetzner.mock', true)) {
            return true;
        }

        $response = $this->request()->post("/servers/{$hetznerId}/actions/poweroff");

        return $response->successful();
    }

    /**
     * Get VNC console URL
     */
    public function getConsole(string $hetznerId): ?string
    {
        if (config('services.hetzner.mock', true)) {
            return "https://console.hetzner.cloud/servers/{$hetznerId}/vnc";
        }

        $response = $this->request()->post("/servers/{$hetznerId}/actions/request_console");

        if ($response->failed()) {
            return null;
        }

        return $response->json('action.root_password') ?? $response->json('wss_url');
    }

    /**
     * List available server types
     */
    public function getServerTypes(): array
    {
        if (config('services.hetzner.mock', true)) {
            return [
                ['name' => 'cx22', 'description' => '2 vCPU, 4GB RAM, 40GB SSD', 'prices' => ['hourly' => 0.0065]],
                ['name' => 'cx32', 'description' => '4 vCPU, 8GB RAM, 80GB SSD', 'prices' => ['hourly' => 0.013]],
                ['name' => 'cx42', 'description' => '8 vCPU, 16GB RAM, 160GB SSD', 'prices' => ['hourly' => 0.026]],
            ];
        }

        $response = $this->request()->get('/server_types');

        return $response->json('server_types', []);
    }

    // Mock methods for development
    protected function mockCreateServer(Server $server): array
    {
        $mockId = 'mock-' . uniqid();
        return [
            'server' => [
                'id' => $mockId,
                'name' => $server->name,
                'public_net' => [
                    'ipv4' => [
                        'ip' => '10.0.0.' . rand(1, 255),
                    ],
                ],
                'status' => 'initializing',
                'server_type' => [
                    'name' => $server->server_type,
                    'description' => '2 vCPU, 4GB RAM, 40GB SSD',
                    'cores' => 2,
                    'memory' => 4,
                    'disk' => 40,
                ],
            ],
            'root_password' => 'mock-password-' . uniqid(),
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
}
