<?php

namespace App\Jobs;

use App\Models\Server;
use App\Services\MailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;

class ProvisionServerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 1800; // 30 minutes
    public int $tries = 1;
    public int $maxExceptions = 1;

    protected Server $server;
    protected string $rootPassword;

    /**
     * Create a new job instance.
     */
    public function __construct(Server $server, string $rootPassword)
    {
        $this->server = $server;
        $this->rootPassword = $rootPassword;
    }

    /**
     * Execute the job.
     */
    public function handle(MailService $mailService): void
    {
        $server = $this->server;
        
        Log::info('Starting server provisioning', ['server_id' => $server->id]);
        
        try {
            $server->update([
                'provision_status' => 'provisioning',
            ]);
            $server->appendProvisionLog('Starting provisioning...');

            // Wait for server to be ready (SSH available)
            $this->waitForServer($server);

            // Generate VNC password
            $vncPassword = Str::random(12);
            $server->update(['vnc_password' => $vncPassword]);
            $server->appendProvisionLog('VNC password generated');

            // Run provisioning script
            $this->runProvisioningScript($server, $vncPassword);

            // Create email account
            $this->createEmailAccount($server, $mailService);

            // Update server status
            $server->update([
                'status' => 'running',
                'provision_status' => 'ready',
                'openclaw_installed' => true,
                'provisioned_at' => now(),
            ]);
            $server->appendProvisionLog('Provisioning completed successfully!');

            Log::info('Server provisioning completed', ['server_id' => $server->id]);

        } catch (\Exception $e) {
            Log::error('Server provisioning failed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $server->update([
                'status' => 'error',
                'provision_status' => 'failed',
            ]);
            $server->appendProvisionLog('ERROR: ' . $e->getMessage());

            throw $e;
        }
    }

    /**
     * Wait for the server to be reachable via SSH
     */
    protected function waitForServer(Server $server): void
    {
        $server->appendProvisionLog('Waiting for server to be reachable...');
        
        $maxAttempts = 60;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $attempt++;
            
            // Try to connect via SSH
            $result = Process::timeout(10)
                ->run("nc -z -w 5 {$server->ip} 22");

            if ($result->successful()) {
                $server->appendProvisionLog("Server is reachable (attempt $attempt)");
                // Give it a few more seconds to fully initialize
                sleep(10);
                return;
            }

            Log::debug('Waiting for server SSH', [
                'server_id' => $server->id,
                'attempt' => $attempt,
            ]);
            
            sleep(5);
        }

        throw new \Exception("Server SSH not available after {$maxAttempts} attempts");
    }

    /**
     * Run the provisioning script on the server
     */
    protected function runProvisioningScript(Server $server, string $vncPassword): void
    {
        $server->appendProvisionLog('Running provisioning script...');

        $scriptPath = base_path('scripts/provision-server.sh');

        // Check if script exists
        if (!file_exists($scriptPath)) {
            throw new \Exception('Provisioning script not found');
        }

        // Check if sshpass is installed
        $sshpassCheck = Process::run('which sshpass');
        if (!$sshpassCheck->successful()) {
            // Install sshpass
            $server->appendProvisionLog('Installing sshpass...');
            Process::run('apt-get update && apt-get install -y sshpass');
        }

        // Run the provisioning script
        $server->appendProvisionLog('Executing remote provisioning...');
        
        $result = Process::timeout(1800) // 30 minutes timeout
            ->run("bash {$scriptPath} {$server->ip} '{$this->rootPassword}' '{$vncPassword}' 2>&1");

        // Log output
        $output = $result->output();
        
        // Truncate output if too long
        if (strlen($output) > 10000) {
            $output = substr($output, -10000);
        }
        
        $server->appendProvisionLog($output);

        if (!$result->successful()) {
            throw new \Exception('Provisioning script failed: ' . $result->errorOutput());
        }

        $server->appendProvisionLog('Provisioning script completed');
    }

    /**
     * Create email account for the server
     */
    protected function createEmailAccount(Server $server, MailService $mailService): void
    {
        try {
            $server->appendProvisionLog('Creating email account...');

            // Generate email credentials
            $username = 'server-' . $server->id;
            $emailPassword = Str::random(16);

            $result = $mailService->createMailbox($username, $emailPassword);

            if ($result) {
                $server->update([
                    'email_address' => $result['email'],
                    'email_password' => $emailPassword,
                ]);
                $server->appendProvisionLog("Email account created: {$result['email']}");
            } else {
                $server->appendProvisionLog('Email account creation skipped (Mailcow not configured)');
            }
        } catch (\Exception $e) {
            // Email creation is not critical, just log the error
            $server->appendProvisionLog('Warning: Email creation failed - ' . $e->getMessage());
            Log::warning('Email account creation failed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('ProvisionServerJob failed permanently', [
            'server_id' => $this->server->id,
            'error' => $exception->getMessage(),
        ]);

        $this->server->update([
            'status' => 'error',
            'provision_status' => 'failed',
        ]);
        $this->server->appendProvisionLog('FATAL ERROR: ' . $exception->getMessage());
    }
}
