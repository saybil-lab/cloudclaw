<?php

namespace App\Services;

use App\Models\Server;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class SshService
{
    protected SshKeyService $keyService;

    public function __construct(SshKeyService $keyService)
    {
        $this->keyService = $keyService;
    }

    /**
     * Execute a command on a remote server via SSH.
     * For Docker containers, routes through docker exec on the host.
     *
     * @return array{stdout: string, stderr: string, exitCode: int, success: bool}
     */
    public function execute(Server $server, string $command, int $timeout = 30): array
    {
        if ($server->deployment_type === 'docker' && $server->container_name) {
            return $this->executeDocker($server, $command, $timeout);
        }

        return $this->executeSsh($server, $command, $timeout);
    }

    /**
     * Execute a command inside a Docker container via SSH to the host.
     *
     * @return array{stdout: string, stderr: string, exitCode: int, success: bool}
     */
    protected function executeDocker(Server $server, string $command, int $timeout): array
    {
        $hostIp = $server->docker_host_ip ?: config('services.docker.host_ip');
        if (!$hostIp) {
            return [
                'stdout' => '',
                'stderr' => 'Docker host IP not configured',
                'exitCode' => 1,
                'success' => false,
            ];
        }

        $dockerCmd = sprintf(
            'docker exec %s bash -c %s',
            escapeshellarg($server->container_name),
            escapeshellarg('export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"; ' . $command)
        );

        // SSH to the Docker host, not the container directly
        $hostServer = new Server();
        $hostServer->ip = $hostIp;

        return $this->executeSsh($hostServer, $dockerCmd, $timeout);
    }

    /**
     * Execute a command on a remote server via direct SSH.
     *
     * @return array{stdout: string, stderr: string, exitCode: int, success: bool}
     */
    protected function executeSsh(Server $server, string $command, int $timeout): array
    {
        if (!$server->ip) {
            return [
                'stdout' => '',
                'stderr' => 'Server has no IP address',
                'exitCode' => 1,
                'success' => false,
            ];
        }

        $keyPath = $this->keyService->getPrivateKeyPath();

        $sshCommand = sprintf(
            'ssh -i %s -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 -o LogLevel=ERROR root@%s %s',
            escapeshellarg($keyPath),
            escapeshellarg($server->ip),
            escapeshellarg($command)
        );

        try {
            $result = Process::timeout($timeout)->run($sshCommand);

            return [
                'stdout' => $result->output(),
                'stderr' => $result->errorOutput(),
                'exitCode' => $result->exitCode(),
                'success' => $result->successful(),
            ];
        } catch (\Exception $e) {
            Log::warning('SSH command failed', [
                'server_id' => $server->id ?? null,
                'ip' => $server->ip,
                'error' => $e->getMessage(),
            ]);

            return [
                'stdout' => '',
                'stderr' => $e->getMessage(),
                'exitCode' => 1,
                'success' => false,
            ];
        }
    }

    /**
     * Check if a server is reachable via SSH (port 22 open).
     */
    public function isReachable(Server $server): bool
    {
        if (!$server->ip) {
            return false;
        }

        try {
            $result = Process::timeout(10)
                ->run("nc -z -w 5 {$server->ip} 22");

            return $result->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Fetch the contents of a remote file (or tail of it).
     */
    public function readFile(Server $server, string $path, int $maxBytes = 4096): string
    {
        $result = $this->execute($server, "tail -c {$maxBytes} " . escapeshellarg($path) . " 2>/dev/null");

        return $result['success'] ? $result['stdout'] : '';
    }

    /**
     * Check if a file exists on the remote server.
     */
    public function fileExists(Server $server, string $path): bool
    {
        $result = $this->execute($server, "test -f " . escapeshellarg($path) . " && echo yes || echo no", 10);

        return $result['success'] && trim($result['stdout']) === 'yes';
    }
}
