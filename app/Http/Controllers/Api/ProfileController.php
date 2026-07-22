<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
            'message' => 'Profile retrieved',
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string'],
            'gender' => ['sometimes', 'nullable', 'string'],
            'district' => ['sometimes', 'nullable', 'string'],
            'address' => ['sometimes', 'nullable', 'string'],
            'latitude' => ['sometimes', 'nullable', 'numeric'],
            'longitude' => ['sometimes', 'nullable', 'numeric'],
        ]);

        $request->user()->update($data);

        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()->fresh()),
            'message' => 'Profile updated',
        ]);
    }
}
