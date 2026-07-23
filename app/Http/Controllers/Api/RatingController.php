<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Support\MediaUrl;

class RatingController extends Controller
{
    /**
     * Leave a rating for a completed order. One per order — the unique index on
     * ratings.order_id enforces it at the database level too.
     */
    public function store(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->receiver_id === $request->user()->id, 403, 'This request is not yours.');

        if ($order->status !== OrderStatus::Completed) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You can only rate a completed request.',
            ], 422);
        }

        if ($order->rating()->exists()) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You have already rated this request.',
            ], 422);
        }

        $data = $request->validate([
            'stars' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $rating = Rating::create([
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'food_donation_id' => $order->food_donation_id,
            'stars' => $data['stars'],
            'comment' => $data['comment'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->present($rating->load('user')),
            'message' => 'Thank you for your feedback',
        ], 201);
    }

    /** Reviews left on a member's donations, newest first. */
    public function forMember(Request $request, User $member): JsonResponse
    {
        $reviews = Rating::query()
            ->with('user')
            ->whereHas('foodDonation', fn ($query) => $query->where('donor_id', $member->id))
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Rating $rating) => $this->present($rating));

        return response()->json([
            'success' => true,
            'data' => [
                'rating' => $reviews->count() > 0
                    ? round($reviews->avg('stars'), 1)
                    : 0.0,
                'reviews_count' => $reviews->count(),
                'reviews' => $reviews->values(),
            ],
            'message' => 'Reviews retrieved',
        ]);
    }

    private function present(Rating $rating): array
    {
        return [
            'id' => $rating->id,
            'stars' => (int) $rating->stars,
            'comment' => $rating->comment,
            'time_ago' => $rating->created_at->diffForHumans(short: true),
            'author_name' => $rating->user?->name,
            'author_photo' => MediaUrl::for($rating->user?->profile_photo),
        ];
    }
}
