<?php

namespace App\Http\Controllers\Api;

use App\Enums\FoodStatus;
use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\CommunityPost;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Models\Rating;
use App\Models\User;
use App\Support\CategoryIcons;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Support\MediaUrl;

class MemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $members = User::query()
            ->whereIn('role', [UserRole::Donor, UserRole::Receiver])
            ->where('is_active', true)
            ->when($request->string('search')->trim()->value(), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->limit(100)
            ->get()
            ->map(function (User $member) {
                $ratings = Rating::whereHas('foodDonation', fn ($q) => $q->where('donor_id', $member->id));
                $reviewsCount = (clone $ratings)->count();

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'rating' => $reviewsCount > 0 ? (float) round((clone $ratings)->avg('stars'), 1) : 0,
                    'reviews_count' => $reviewsCount,
                    'role_label' => 'Member',
                    'profile_photo' => MediaUrl::for($member->profile_photo),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $members,
            'message' => 'Members retrieved',
        ]);
    }

    public function show(User $member): JsonResponse
    {
        $member->loadMissing('country');

        $posts = CommunityPost::where('user_id', $member->id)->count();
        $shared = FoodDonation::where('donor_id', $member->id)->count();
        $helped = Order::whereHas('foodDonation', fn ($q) => $q->where('donor_id', $member->id))
            ->where('status', OrderStatus::Completed)
            ->count();

        $ratings = Rating::whereHas('foodDonation', fn ($q) => $q->where('donor_id', $member->id));
        $reviewsCount = (clone $ratings)->count();
        $rating = $reviewsCount > 0 ? round((clone $ratings)->avg('stars'), 1) : 0;

        $activity = FoodDonation::with(['category', 'unit'])
            ->where('donor_id', $member->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (FoodDonation $donation) => [
                'id' => $donation->id,
                'title' => $donation->title,
                'detail' => $donation->quantity,
                'category_icon' => CategoryIcons::for($donation->category?->name),
                'time_ago' => $donation->created_at->diffForHumans(),
                'status' => $donation->status === FoodStatus::Published
                    ? 'Active'
                    : $donation->status->getLabel(),
            ]);

        $location = collect([$member->district, $member->country?->name])
            ->filter()
            ->implode(', ');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $member->id,
                'name' => $member->name,
                'role_label' => 'Member',
                'profile_photo' => MediaUrl::for($member->profile_photo),
                'rating' => (float) $rating,
                'reviews_count' => $reviewsCount,
                'location' => $location,
                'stats' => [
                    'posts' => $posts,
                    'shared' => $shared,
                    'helped' => $helped,
                ],
                'about' => $member->bio,
                'recent_activity' => $activity,
            ],
            'message' => 'Member profile retrieved',
        ]);
    }
}
