<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Services\ResponsibilityScoreService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'receiver_id',
        'food_donation_id',
        'status',
        'points_spent',
        'units',
        'delivery_method',
        'delivery_address',
        'preferred_quantity',
        'scheduled_pickup_at',
        'need_by',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'status' => OrderStatus::class,
        'units' => 'integer',
        'scheduled_pickup_at' => 'datetime',
        'need_by' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::updated(function (Order $order) {
            if ($order->isDirty('status')) {
                app(ResponsibilityScoreService::class)->update($order);
            }
        });
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function foodDonation(): BelongsTo
    {
        return $this->belongsTo(FoodDonation::class);
    }

    public function rating(): HasOne
    {
        return $this->hasOne(Rating::class);
    }
}
