<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'content' => $this->content,
            'cover_image' => $this->cover_image ? Storage::url($this->cover_image) : null,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
