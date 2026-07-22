<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'district' => $this->district,
            'address' => $this->address,
            'profile_photo' => $this->profile_photo,
            'wallet_balance' => $this->wallet_balance,
            'responsibility_score' => $this->responsibility_score,
        ];
    }
}
