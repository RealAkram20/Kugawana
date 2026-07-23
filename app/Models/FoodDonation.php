<?php

namespace App\Models;

use App\Enums\FoodStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FoodDonation extends Model
{
    protected $fillable = [
        'donor_id',
        'food_category_id',
        'warehouse_id',
        'country_id',
        'title',
        'description',
        'amount',
        'unit_id',
        'preparation_date',
        'expiry_date',
        'pickup_address',
        'latitude',
        'longitude',
        'special_instructions',
        'images',
        'contact_number',
        'status',
        'points_required',
        'admin_notes',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'status' => FoodStatus::class,
        'images' => 'array',
        'amount' => 'decimal:2',
        'preparation_date' => 'date',
        'expiry_date' => 'datetime',
        'approved_at' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FoodCategory::class, 'food_category_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * The human-readable quantity, e.g. "2 Kg". Quantity used to be a free-text
     * column; keeping the same attribute name means every screen and export that
     * already reads `$donation->quantity` keeps working against the new columns.
     */
    protected function quantity(): Attribute
    {
        return Attribute::get(function (): string {
            $amount = rtrim(rtrim(number_format((float) $this->amount, 2, '.', ''), '0'), '.');
            $symbol = $this->unit?->symbol;

            return $symbol ? "{$amount} {$symbol}" : $amount;
        });
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', FoodStatus::Published)
            ->where('expiry_date', '>', now());
    }
}
