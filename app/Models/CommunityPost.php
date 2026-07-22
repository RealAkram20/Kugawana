<?php

namespace App\Models;

use App\Enums\PostStatus;
use App\Enums\PostType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityPost extends Model
{
    protected $fillable = [
        'user_id',
        'content',
        'post_type',
        'location',
        'images',
        'status',
        'likes_count',
        'comments_count',
    ];

    protected $casts = [
        'status' => PostStatus::class,
        'post_type' => PostType::class,
        'images' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CommunityComment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(CommunityLike::class);
    }
}
