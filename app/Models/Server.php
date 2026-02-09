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
        'datacenter',
        'image',
        'specs',
        'vnc_url',
        'openclaw_installed',
        'provisioned_at',
    ];

    protected $casts = [
        'specs' => 'array',
        'openclaw_installed' => 'boolean',
        'provisioned_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isRunning(): bool
    {
        return $this->status === 'running';
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['pending', 'provisioning']);
    }
}
