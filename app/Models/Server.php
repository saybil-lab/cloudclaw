<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Server extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'hetzner_id',
        'name',
        'ip',
        'status',
        'server_type',
        'monthly_price',
        'datacenter',
        'image',
        'specs',
        'vnc_url',
        'vnc_password',
        'email_address',
        'email_password',
        'provision_status',
        'provision_log',
        'root_password',
        'openclaw_installed',
        'provisioned_at',
        'telegram_token',
        'bot_username',
        'llm_usage_billed',
        'deployment_type',
        'container_name',
        'docker_host_ip',
        'docker_host_id',
    ];

    protected $casts = [
        'specs' => 'array',
        'openclaw_installed' => 'boolean',
        'provisioned_at' => 'datetime',
        'monthly_price' => 'decimal:2',
    ];

    protected $hidden = [
        'vnc_password',
        'email_password',
        'root_password',
        'telegram_token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function dockerHost(): BelongsTo
    {
        return $this->belongsTo(DockerHost::class);
    }

    public function isDocker(): bool
    {
        return $this->deployment_type === 'docker';
    }

    public function isRunning(): bool
    {
        return $this->status === 'running';
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['pending', 'provisioning']);
    }

    public function isReady(): bool
    {
        return $this->provision_status === 'ready' && $this->status === 'running';
    }

    public function appendProvisionLog(string $message): void
    {
        $timestamp = now()->format('Y-m-d H:i:s');
        $log = $this->provision_log ?? '';
        $log .= "[{$timestamp}] {$message}\n";
        $this->update(['provision_log' => $log]);
    }

    public function getNoVncUrl(): ?string
    {
        if (!$this->ip || !$this->vnc_password) {
            return null;
        }
        return "https://{$this->ip}:6080/vnc.html?password=" . urlencode($this->vnc_password);
    }
}
