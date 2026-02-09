<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Credit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(CreditTransaction::class);
    }

    public function addCredits(float $amount, string $type, string $description = null, ?string $stripePaymentIntentId = null): CreditTransaction
    {
        $this->balance += $amount;
        $this->save();

        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'type' => $type,
            'amount' => $amount,
            'balance_after' => $this->balance,
            'description' => $description,
            'stripe_payment_intent_id' => $stripePaymentIntentId,
        ]);
    }

    public function deductCredits(float $amount, string $description = null, ?int $serverId = null): ?CreditTransaction
    {
        if ($this->balance < $amount) {
            return null;
        }

        $this->balance -= $amount;
        $this->save();

        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'type' => 'usage',
            'amount' => -$amount,
            'balance_after' => $this->balance,
            'description' => $description,
            'server_id' => $serverId,
        ]);
    }

    public function hasEnoughCredits(float $amount): bool
    {
        return $this->balance >= $amount;
    }
}
