<?php

namespace App\Http\Resources;

use App\Enums\OrderStatus;
use App\Support\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'points_spent' => $this->points_spent,
            'delivery_method' => $this->delivery_method,
            'delivery_address' => $this->delivery_address,
            'preferred_quantity' => $this->preferred_quantity,
            'scheduled_pickup_at' => $this->scheduled_pickup_at?->toIso8601String(),
            'need_by' => $this->need_by?->toIso8601String(),
            'notes' => $this->notes,
            'can_complete' => ! in_array($this->status, [
                OrderStatus::Completed,
                OrderStatus::Cancelled,
            ], true),
            // Terms can still be changed while nobody has committed to it; once
            // accepted the request is an agreement, so only cancelling remains.
            'can_edit' => $this->status === OrderStatus::Pending,
            'can_cancel' => in_array($this->status, [
                OrderStatus::Pending,
                OrderStatus::Accepted,
            ], true),
            'can_rate' => $this->status === OrderStatus::Completed
                && $this->whenLoaded('rating', fn () => $this->rating === null, true),
            'my_rating' => $this->whenLoaded('rating', fn () => $this->rating ? [
                'stars' => (int) $this->rating->stars,
                'comment' => $this->rating->comment,
            ] : null),
            'time_ago' => $this->created_at->diffForHumans(short: true),
            'created_at' => $this->created_at->toIso8601String(),
            'food' => new FoodResource($this->whenLoaded('foodDonation')),
            'provider' => $this->providerPayload(),
            'requester' => $this->whenLoaded('receiver', fn () => [
                'id' => $this->receiver->id,
                'name' => $this->receiver->name,
                'profile_photo' => MediaUrl::for($this->receiver->profile_photo),
            ]),
        ];
    }

    /**
     * The donor behind this order, with the rating shown on the request card.
     * Needs foodDonation.donor loaded; the averages come from withAvg/withCount
     * on the query so this stays a single trip for the whole list.
     */
    private function providerPayload(): ?array
    {
        $donor = $this->whenLoaded('foodDonation')->donor ?? null;

        if (! $donor) {
            return null;
        }

        $count = (int) ($donor->ratings_received_count ?? 0);

        // Preferred number for the contact button: the one attached to the
        // listing, falling back to the donor's own phone.
        $contact = $this->whenLoaded('foodDonation')->contact_number ?: $donor->phone;

        return [
            'id' => $donor->id,
            'name' => $donor->name,
            'profile_photo' => MediaUrl::for($donor->profile_photo),
            'rating' => $count > 0 ? round((float) $donor->ratings_received_avg_stars, 1) : 0.0,
            'reviews_count' => $count,
            'contact_number' => $contact,
            'whatsapp_number' => PhoneNumber::toE164($contact, $donor->country?->code),
        ];
    }
}
