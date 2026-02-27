<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class SshKeyService
{
    protected string $keyDirectory;
    protected string $privateKeyPath;
    protected string $publicKeyPath;

    public function __construct()
    {
        $this->keyDirectory = storage_path('app/cloudclaw_ssh');
        $this->privateKeyPath = $this->keyDirectory . '/id_ed25519';
        $this->publicKeyPath = $this->keyDirectory . '/id_ed25519.pub';
    }

    /**
     * Get the path to the private key, generating the keypair if needed.
     */
    public function getPrivateKeyPath(): string
    {
        $this->ensureKeyExists();
        return $this->privateKeyPath;
    }

    /**
     * Get the public key contents, generating the keypair if needed.
     */
    public function getPublicKey(): string
    {
        $this->ensureKeyExists();
        return trim(file_get_contents($this->publicKeyPath));
    }

    /**
     * Check if the SSH key pair already exists.
     */
    public function keyExists(): bool
    {
        return file_exists($this->privateKeyPath) && file_exists($this->publicKeyPath);
    }

    /**
     * Generate a new Ed25519 SSH key pair if one doesn't exist.
     */
    protected function ensureKeyExists(): void
    {
        if ($this->keyExists()) {
            return;
        }

        // Create the directory with restricted permissions
        if (!is_dir($this->keyDirectory)) {
            mkdir($this->keyDirectory, 0700, true);
        }

        // Generate Ed25519 keypair
        $result = Process::run(
            "ssh-keygen -t ed25519 -f {$this->privateKeyPath} -N '' -C 'cloudclaw@server' -q"
        );

        if (!$result->successful()) {
            throw new \RuntimeException('Failed to generate SSH key pair: ' . $result->errorOutput());
        }

        // Ensure correct permissions
        chmod($this->privateKeyPath, 0600);
        chmod($this->publicKeyPath, 0644);

        Log::info('CloudClaw SSH key pair generated', [
            'public_key_path' => $this->publicKeyPath,
        ]);
    }
}
