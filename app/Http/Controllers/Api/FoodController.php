<?php

namespace App\Http\Controllers\Api;

use App\Enums\FoodStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\FoodResource;
use App\Models\FoodCategory;
use App\Models\FoodDonation;
use App\Models\Unit;
use App\Services\RewardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Support\MediaUrl;

class FoodController extends Controller
{
    /** Matches the maxFiles() on the Filament photo uploader. */
    private const MAX_IMAGES = 5;

    public function index(Request $request): JsonResponse
    {
        $listings = FoodDonation::query()
            ->with(['category', 'donor', 'unit'])
            ->published()
            ->when($request->query('category_id'), fn ($q, $categoryId) => $q->where('food_category_id', $categoryId))
            ->when($request->query('search'), fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => FoodResource::collection($listings),
            'message' => 'Food retrieved',
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        $donations = FoodDonation::query()
            ->with(['category', 'unit'])
            ->where('donor_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => FoodResource::collection($donations),
            'message' => 'Donations retrieved',
        ]);
    }

    public function show(Request $request, FoodDonation $food): JsonResponse
    {
        $food->load(['category', 'donor', 'unit']);

        if ($request->user()?->id === $food->donor_id) {
            $food->load('orders.receiver');
        }

        return response()->json([
            'success' => true,
            'data' => new FoodResource($food),
            'message' => 'Food retrieved',
        ]);
    }

    public function update(Request $request, FoodDonation $food): JsonResponse
    {
        $this->authorizeOwner($request, $food);

        if (! $food->donorCanManage()) {
            return $this->handedOver();
        }

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:999999'],
            'unit_id' => ['sometimes', 'required', Rule::exists('units', 'id')->where('is_active', true)],
            'pickup_address' => ['sometimes', 'required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'expiry_date' => ['sometimes', 'required', 'date', 'after:now'],
            'special_instructions' => ['nullable', 'string'],
            'images' => ['nullable', 'array', 'max:'.self::MAX_IMAGES],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        unset($data['images']);

        // Photos are only touched when new files are actually uploaded, so a
        // plain field edit never wipes the existing gallery.
        if ($request->hasFile('images')) {
            $data['images'] = $this->storeImages($request);
        }

        $food->update($data);
        $food->load(['category', 'donor', 'unit', 'orders.receiver']);

        return response()->json([
            'success' => true,
            'data' => new FoodResource($food),
            'message' => 'Donation updated',
        ]);
    }

    public function complete(Request $request, FoodDonation $food): JsonResponse
    {
        $this->authorizeOwner($request, $food);

        if (! $food->donorCanManage()) {
            return $this->handedOver();
        }

        $food->update(['status' => FoodStatus::Completed]);
        $food->load(['category', 'donor', 'unit', 'orders.receiver']);

        app(RewardService::class)->award($request->user(), 'donation', 'donation:' . $food->id);

        return response()->json([
            'success' => true,
            'data' => new FoodResource($food),
            'message' => 'Donation marked as completed',
        ]);
    }

    public function interested(Request $request, FoodDonation $food): JsonResponse
    {
        $this->authorizeOwner($request, $food);

        $people = $food->orders()
            ->with('receiver')
            ->latest()
            ->get()
            ->filter(fn ($order) => $order->receiver !== null)
            ->unique(fn ($order) => $order->receiver->id)
            ->values()
            ->map(fn ($order) => [
                'id' => $order->receiver->id,
                'name' => $order->receiver->name,
                'profile_photo' => MediaUrl::for($order->receiver->profile_photo),
                'district' => $order->receiver->district,
                'delivery_method' => $order->delivery_method,
                'requested_ago' => $order->created_at->diffForHumans(short: true),
            ]);

        return response()->json([
            'success' => true,
            'data' => $people,
            'message' => 'Interested people retrieved',
        ]);
    }

    private function authorizeOwner(Request $request, FoodDonation $food): void
    {
        abort_unless($request->user()?->id === $food->donor_id, 403, 'This donation is not yours.');
    }

    /**
     * The app hides these actions on an approved listing, but a stale screen or
     * a direct call can still reach them, so the refusal lives here too.
     */
    private function handedOver(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => 'This food has been taken in by the Kugawana team and can no longer be changed here.',
        ], 422);
    }

    /**
     * Move uploaded photos onto the public disk under food/, which is the same
     * place the Filament uploader and the seeder write to, so MediaUrl can turn
     * every one of them into a URL without special-casing.
     *
     * @return array<int, string>
     */
    private function storeImages(Request $request): array
    {
        return collect($request->file('images') ?? [])
            ->take(self::MAX_IMAGES)
            ->map(fn ($file) => $file->store('food', 'public'))
            ->values()
            ->all();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'food_category_id' => ['required', 'exists:food_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999'],
            'unit_id' => ['required', Rule::exists('units', 'id')->where('is_active', true)],
            'pickup_address' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'expiry_date' => ['required', 'date', 'after:now'],
            'preparation_date' => ['nullable', 'date'],
            'special_instructions' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'images' => ['nullable', 'array', 'max:'.self::MAX_IMAGES],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        unset($data['images']);

        $donation = FoodDonation::create([
            ...$data,
            'images' => $this->storeImages($request),
            'donor_id' => $request->user()->id,
            'country_id' => $request->user()->country_id,
            'status' => FoodStatus::Pending,
        ]);

        $donation->load(['category', 'unit']);

        return response()->json([
            'success' => true,
            'data' => new FoodResource($donation),
            'message' => 'Donation submitted for review',
        ], 201);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => FoodCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'message' => 'Categories retrieved',
        ]);
    }

    public function units(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Unit::where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'symbol']),
            'message' => 'Units retrieved',
        ]);
    }
}
