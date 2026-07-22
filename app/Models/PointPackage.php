<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PointPackage extends Model
{
    protected $fillable = [
        'name',
        'points',
        'price',
        'currency',
        'country_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}
