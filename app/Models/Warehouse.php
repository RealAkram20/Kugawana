<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model
{
    protected $fillable = [
        'name',
        'country_id',
        'district',
        'address',
        'latitude',
        'longitude',
        'is_refrigerated',
        'capacity',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_refrigerated' => 'boolean',
        'is_active' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function donations(): HasMany
    {
        return $this->hasMany(FoodDonation::class);
    }
}
