<?php

namespace App\Models;

use App\Enums\TopupStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTopup extends Model
{
    protected $fillable = [
        'user_id',
        'point_package_id',
        'points',
        'amount',
        'currency',
        'payment_method',
        'payment_reference',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'status' => TopupStatus::class,
        'approved_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pointPackage(): BelongsTo
    {
        return $this->belongsTo(PointPackage::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
