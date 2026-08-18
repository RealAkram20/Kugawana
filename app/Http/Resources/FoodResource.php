<?php

namespace App\Http\Resources;

use App\Enums\FoodStatus;
use App\Models\Order;
use App\Support\CategoryIcons;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class FoodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isOwner = $request->user()?->id === $this->donor_id;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            // `quantity` is the preformatted label ("2 Kg"); amount/unit are the
            // structured values the share and edit forms bind to.
            'quantity' => $this->quantity,
            'amount' => (float) $this->amount,
            // A split batch is claimed one unit at a time, so the app needs the
            // unit size and what is left as well as the whole amount.
            'is_split' => $this->isSplit(),
            'unit_amount' => $this->unit_amount === null ? null : (float) $this->unit_amount,
            'unit_quantity' => $this->unit_quantity,
            'units_total' => $this->units_total,
            'units_available' => $this->units_available,
            'unit' => $this->whenLoaded('unit', fn () => $this->unit ? [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
                'symbol' => $this->unit->symbol,
            ] : null),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'category_icon' => CategoryIcons::for($this->category?->name),
            'images' => MediaUrl::all($this->images),
            'points_required' => $this->points_required,
            'pickup_address' => $this->pickup_address,
            'expiry_date' => $this->expiry_date?->toIso8601String(),
            'donor_id' => $this->donor_id,
            'donor_name' => $this->whenLoaded('donor', fn () => $this->donor?->name),
            'status' => $this->status->value,
            'is_active' => $this->status === FoodStatus::Published
                && $this->expiry_date?->isFuture()
                && ! $this->isSoldOut(),
            'is_owner' => $isOwner,
            // Both stop at approval: once the team has taken the food in, it is
            // theirs to manage. Kept as two flags so the app can label each
            // button, and so they can diverge later without an API change.
            'can_edit' => $isOwner && $this->donorCanManage(),
            'can_complete' => $isOwner && $this->donorCanManage(),
            'time_ago' => $this->created_at?->diffForHumans(short: true),
            'created_at' => $this->created_at?->toIso8601String(),

            // Who requested this food is private to the donor.
            $this->mergeWhen($isOwner, fn () => $this->interestedPayload()),
        ];
    }

    /**
     * A preview of the people who have requested this donation, for the
     * avatar stack on the owner's detail screen.
     */
    private function interestedPayload(): array
    {
        $orders = $this->whenLoaded('orders');

        if ($orders instanceof \Illuminate\Http\Resources\MissingValue) {
            return [];
        }

        $receivers = $orders
            ->map(fn (Order $order) => $order->receiver)
            ->filter()
            ->unique('id')
            ->values();

        return [
            'interested_count' => $receivers->count(),
            'interested' => $receivers->take(5)->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'profile_photo' => MediaUrl::for($user->profile_photo),
            ])->all(),
        ];
    }
}
