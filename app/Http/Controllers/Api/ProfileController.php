<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\PushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            // Unique so a Google-created account completing its number (or anyone
            // editing theirs) collides with a clear 422, not a database error.
            // Required-when-present so a number can be corrected but never
            // cleared back to null — the phone.required routes depend on it.
            'phone' => ['sometimes', 'required', 'string', 'regex:/^\+[1-9]\d{6,14}$/', Rule::unique('users', 'phone')->ignore($request->user()->id)],
            'phone_country' => ['sometimes', 'nullable', 'string', 'size:2'],
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
        ], [
            'phone.regex' => 'Enter your phone number including the country code',
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

    /**
     * Google Play requires in-app account deletion. Orders, donations, and the
     * wallet ledger keep their rows — money history must stay auditable — but
     * everything that identifies the person is removed, every session and
     * device token is revoked, and the account can never be signed into again
     * (no password, no google_id, inactive, and a claimed-nowhere email).
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user) {
            if (filled($user->profile_photo) && ! str_starts_with($user->profile_photo, 'http')) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $user->tokens()->delete();
            PushToken::where('user_id', $user->id)->delete();

            $user->forceFill([
                'name' => 'Deleted user',
                'email' => 'deleted-' . $user->id . '@removed.kugawana.app',
                'email_verified_at' => null,
                'phone' => null,
                'phone_country' => null,
                'google_id' => null,
                'password' => null,
                'gender' => null,
                'district' => null,
                'address' => null,
                'bio' => null,
                'latitude' => null,
                'longitude' => null,
                'profile_photo' => null,
                'is_active' => false,
            ])->save();
        });

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Your account has been deleted',
        ]);
    }
}
