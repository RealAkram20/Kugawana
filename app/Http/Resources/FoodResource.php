<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FoodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'images' => collect($this->images ?? [])->map(fn ($path) => Storage::url($path))->all(),
            'points_required' => $this->points_required,
            'pickup_address' => $this->pickup_address,
            'expiry_date' => $this->expiry_date?->toIso8601String(),
            'donor_name' => $this->whenLoaded('donor', fn () => $this->donor?->name),
            'status' => $this->status->value,
        ];
    }
}
