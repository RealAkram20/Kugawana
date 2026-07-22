<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RewardCampaign extends Model
{
    protected $fillable = [
        'name',
        'description',
        'points',
        'type',
        'country_id',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}
