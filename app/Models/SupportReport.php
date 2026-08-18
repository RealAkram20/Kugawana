<?php

namespace App\Models;

use App\Enums\SupportReportStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportReport extends Model
{
    protected $fillable = [
        'user_id',
        'subject',
        'message',
        'status',
        'admin_response',
        'handled_by',
        'resolved_at',
    ];

    protected $casts = [
        'status' => SupportReportStatus::class,
        'resolved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
