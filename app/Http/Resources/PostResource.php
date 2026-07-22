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
            'images' => collect($this->images ?? [])->map(fn ($path) => Storage::url($path))->all(),
            'author_name' => $this->user?->name,
            'likes_count' => $this->likes_count,
            'comments_count' => $this->comments_count,
            'liked' => (bool) ($this->liked ?? false),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
