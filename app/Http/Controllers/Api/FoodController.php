<?php

namespace App\Http\Controllers\Api;

use App\Enums\FoodStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\FoodResource;
use App\Models\FoodCategory;
use App\Models\FoodDonation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $listings = FoodDonation::query()
            ->with(['category', 'donor'])
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
            ->with(['category'])
            ->where('donor_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => FoodResource::collection($donations),
            'message' => 'Donations retrieved',
        ]);
    }

    public function show(FoodDonation $food): JsonResponse
    {
        $food->load(['category', 'donor']);

        return response()->json([
            'success' => true,
            'data' => new FoodResource($food),
            'message' => 'Food retrieved',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'food_category_id' => ['required', 'exists:food_categories,id'],
            'quantity' => ['required', 'string', 'max:100'],
            'pickup_address' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'expiry_date' => ['required', 'date', 'after:now'],
            'preparation_date' => ['nullable', 'date'],
            'special_instructions' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
        ]);

        $donation = FoodDonation::create([
            ...$data,
            'donor_id' => $request->user()->id,
            'country_id' => $request->user()->country_id,
            'status' => FoodStatus::Pending,
        ]);

        $donation->load('category');

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
}
