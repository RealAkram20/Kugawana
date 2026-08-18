<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role->value,
            'country_id' => $this->country_id,
            'country_name' => $this->whenLoaded('country', fn () => $this->country?->name),
            'district' => $this->district,
            'address' => $this->address,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'bio' => $this->bio,
            'profile_photo' => MediaUrl::for($this->profile_photo),
            'wallet_balance' => $this->wallet_balance,
            'responsibility_score' => $this->responsibility_score,
        ];
    }
}
