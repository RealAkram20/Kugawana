<?php

namespace App\Models;

use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'points',
        'reason',
        'reference',
    ];

    protected $casts = [
        'type' => TransactionType::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
