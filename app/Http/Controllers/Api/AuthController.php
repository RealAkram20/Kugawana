<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Country;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in([UserRole::Donor->value, UserRole::Receiver->value])],
        ]);

        $country = Country::where('is_active', true)->first();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'country_id' => $country?->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $user->createToken('mobile')->plainTextToken,
                'user' => new UserResource($user),
            ],
            'message' => 'Account created',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'These credentials do not match our records',
            ], 422);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This account is suspended',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $user->createToken('mobile')->plainTextToken,
                'user' => new UserResource($user),
            ],
            'message' => 'Signed in',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Signed out',
        ]);
    }
}
