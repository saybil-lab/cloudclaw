<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DockerHost extends Model
{
    protected $fillable = [
        'hetzner_id',
        'name',
        'ip',
        'server_type',
        'location',
        'status',
        'max_containers',
        'ready_at',
        'provision_log',
    ];

    protected $casts = [
        'ready_at' => 'datetime',
        'max_containers' => 'integer',
    ];

    public function servers(): HasMany
    {
        return $this->hasMany(Server::class, 'docker_host_id')
            ->where('deployment_type', 'docker')
            ->whereNotIn('status', ['deleted']);
    }

    public function activeContainerCount(): int
    {
        return $this->servers()->count();
    }

    public function availableSlots(): int
    {
        return max(0, $this->max_containers - $this->activeContainerCount());
    }

    public function isReady(): bool
    {
        return $this->status === 'ready';
    }

    public function appendProvisionLog(string $message): void
    {
        $timestamp = now()->format('Y-m-d H:i:s');
        $log = $this->provision_log ?? '';
        $log .= "[{$timestamp}] {$message}\n";
        $this->update(['provision_log' => $log]);
    }
}
