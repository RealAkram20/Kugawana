<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'post_type' => $this->post_type?->value,
            'location' => $this->location,
            'images' => collect($this->images ?? [])->map(fn ($path) => Storage::url($path))->all(),
            'author_id' => $this->user_id,
            'author_name' => $this->user?->name,
            'profile_photo' => $this->user?->profile_photo
                ? Storage::url($this->user->profile_photo)
                : null,
            'likes_count' => (int) $this->likes_count,
            'comments_count' => (int) $this->comments_count,
            'liked' => (bool) ($this->liked ?? false),
            'time_ago' => $this->created_at->diffForHumans(short: true),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
