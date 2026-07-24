<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()->loadMissing('country')),
            'message' => 'Profile retrieved',
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string'],
            'gender' => ['sometimes', 'nullable', 'string'],
            // Only somewhere Kugawana actually operates — an inactive or unknown
            // country would leave the member invisible to every country admin.
            'country_id' => ['sometimes', 'nullable', Rule::exists('countries', 'id')->where('is_active', true)],
            'district' => ['sometimes', 'nullable', 'string'],
            'address' => ['sometimes', 'nullable', 'string'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            'latitude' => ['sometimes', 'nullable', 'numeric'],
            'longitude' => ['sometimes', 'nullable', 'numeric'],
            'profile_photo' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $user = $request->user();

        // The photo arrives as an upload, never as a string — drop the validated
        // entry either way so a stale path can't be written over the real one.
        unset($data['profile_photo']);

        if ($request->hasFile('profile_photo')) {
            $previous = $user->profile_photo;

            // Same public disk the Filament uploader and seeder use, so MediaUrl
            // turns every avatar into a URL without special-casing.
            $data['profile_photo'] = $request->file('profile_photo')->store('avatars', 'public');

            // Seeded avatars are absolute URLs to remote images; only files we
            // actually put on the disk are ours to delete.
            if (filled($previous) && ! str_starts_with($previous, 'http')) {
                Storage::disk('public')->delete($previous);
            }
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'data' => new UserResource($user->fresh()->loadMissing('country')),
            'message' => 'Profile updated',
        ]);
    }
}
