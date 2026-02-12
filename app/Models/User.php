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
        'llm_billing_mode',
        'anthropic_api_key',
        'openai_api_key',
        'llm_credits',
        'use_case',
        'team_size',
        'priority',
        'onboarding_completed',
        'subscription_status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'anthropic_api_key',
        'openai_api_key',
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
            'llm_credits' => 'decimal:2',
            'onboarding_completed' => 'boolean',
        ];
    }

    /**
     * Encrypt API keys when setting
     */
    public function setAnthropicApiKeyAttribute(?string $value): void
    {
        $this->attributes['anthropic_api_key'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getAnthropicApiKeyAttribute(?string $value): ?string
    {
        if (!$value) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function setOpenaiApiKeyAttribute(?string $value): void
    {
        $this->attributes['openai_api_key'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getOpenaiApiKeyAttribute(?string $value): ?string
    {
        if (!$value) return null;
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
     * Check if user uses their own LLM API keys (BYOK)
     */
    public function isLlmByokMode(): bool
    {
        return $this->llm_billing_mode === 'byok';
    }

    /**
     * Check if user uses CloudClaw LLM credits
     */
    public function isLlmCreditsMode(): bool
    {
        return $this->llm_billing_mode === 'credits';
    }

    /**
     * Check if user has configured at least one LLM API key
     */
    public function hasLlmApiKey(): bool
    {
        return !empty($this->anthropic_api_key) || !empty($this->openai_api_key);
    }

    /**
     * Get the user's preferred LLM API key
     */
    public function getLlmApiKey(string $provider = 'anthropic'): ?string
    {
        return match($provider) {
            'anthropic' => $this->anthropic_api_key,
            'openai' => $this->openai_api_key,
            default => null,
        };
    }

    /**
     * Check if user has an active subscription
     */
    public function hasActiveSubscription(): bool
    {
        return $this->subscription_status === 'active';
    }

    /**
     * Check if user is on trial
     */
    public function isOnTrial(): bool
    {
        return $this->subscription_status === 'trial';
    }
}
