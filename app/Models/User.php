<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Crypt;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
        'stripe_customer_id',
        'billing_mode',
        'hetzner_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'hetzner_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Encrypt the Hetzner token when setting
     */
    public function setHetznerTokenAttribute(?string $value): void
    {
        $this->attributes['hetzner_token'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Decrypt the Hetzner token when getting
     */
    public function getHetznerTokenAttribute(?string $value): ?string
    {
        if (!$value) {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function servers(): HasMany
    {
        return $this->hasMany(Server::class);
    }

    public function credit(): HasOne
    {
        return $this->hasOne(Credit::class);
    }

    public function creditTransactions(): HasMany
    {
        return $this->hasMany(CreditTransaction::class);
    }

    public function isAdmin(): bool
    {
        return $this->is_admin;
    }

    public function getOrCreateCredit(): Credit
    {
        return $this->credit ?? $this->credit()->create(['balance' => 0]);
    }

    /**
     * Check if user is in BYOK mode
     */
    public function isByokMode(): bool
    {
        return $this->billing_mode === 'byok';
    }

    /**
     * Check if user is in credits mode
     */
    public function isCreditsMode(): bool
    {
        return $this->billing_mode === 'credits';
    }

    /**
     * Check if user has configured BYOK
     */
    public function hasByokConfigured(): bool
    {
        return $this->billing_mode === 'byok' && !empty($this->hetzner_token);
    }
}
