<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Country;
use App\Models\User;
use App\Services\RewardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * How much of the tail we match on when a phone is typed in local form
     * (0712…) against a stored international one (+254712…). Countries run
     * from 7-digit to 10-digit national numbers, so the shorter bound decides
     * whether we look at all and the longer one keeps the match specific.
     */
    private const PHONE_MIN = 7;

    private const PHONE_TAIL = 9;

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^\+[1-9]\d{6,14}$/', 'unique:users,phone'],
            'phone_country' => ['nullable', 'string', 'size:2'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', Rule::in([UserRole::Donor->value, UserRole::Receiver->value])],
        ], [
            'phone.regex' => 'Enter your phone number including the country code',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'phone_country' => isset($data['phone_country']) ? strtoupper($data['phone_country']) : null,
            'password' => Hash::make($data['password']),
            'role' => $data['role'] ?? UserRole::Receiver->value,
            'country_id' => $this->resolveCountryId($data['phone_country'] ?? null),
        ]);

        app(RewardService::class)->award($user, 'signup');

        return $this->tokenResponse($user, 'Account created', 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            // `email` is still accepted so older builds of the app keep working
            'identifier' => ['required_without:email', 'nullable', 'string'],
            'email' => ['required_without:identifier', 'nullable', 'string'],
            'password' => ['required', 'string'],
        ]);

        $identifier = trim($data['identifier'] ?? $data['email'] ?? '');
        $user = $this->findByIdentifier($identifier);

        if (! $user || ! $user->password || ! Hash::check($data['password'], $user->password)) {
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

        return $this->tokenResponse($user, 'Signed in');
    }

    /**
     * Signs a user in from a Google ID token obtained by the mobile app.
     * Verification is delegated to Google so we never trust the client's copy
     * of the profile.
     */
    public function google(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_token' => ['required', 'string'],
        ]);

        $clientIds = config('services.google.client_ids');

        if (empty($clientIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Google sign-in is not configured on this server',
            ], 503);
        }

        $payload = $this->verifyGoogleToken($data['id_token'], $clientIds);

        if (! $payload) {
            return response()->json([
                'success' => false,
                'message' => 'We could not verify that Google account',
            ], 422);
        }

        $user = User::where('google_id', $payload['sub'])->first()
            ?? User::where('email', $payload['email'])->first();

        if ($user) {
            // First Google sign-in on an account that was created with a password
            if (! $user->google_id) {
                $user->forceFill(['google_id' => $payload['sub']])->save();
            }
        } else {
            $user = User::create([
                'name' => $payload['name'] ?: Str::before($payload['email'], '@'),
                'email' => $payload['email'],
                'google_id' => $payload['sub'],
                'password' => null,
                'role' => UserRole::Receiver->value,
                'email_verified_at' => now(),
                'country_id' => $this->resolveCountryId(null),
            ]);

            app(RewardService::class)->award($user, 'signup');
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This account is suspended',
            ], 403);
        }

        return $this->tokenResponse($user, 'Signed in');
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

    /**
     * Resolves an email address or a phone number in any common shape
     * (+254712345678, 0712345678, 254712345678) to a single account.
     */
    private function findByIdentifier(string $identifier): ?User
    {
        if (Str::contains($identifier, '@')) {
            return User::where('email', $identifier)->first();
        }

        $digits = preg_replace('/\D/', '', $identifier);

        if (strlen($digits) < self::PHONE_MIN) {
            return null;
        }

        $exact = User::where('phone', '+'.$digits)->first();

        if ($exact) {
            return $exact;
        }

        // Typed without the country code: match on the national part instead.
        $tail = substr($digits, -min(self::PHONE_TAIL, strlen($digits)));
        $matches = User::where('phone', 'like', '%'.$tail)->limit(2)->get();

        // Two accounts in different countries can share a tail — refuse to guess.
        return $matches->count() === 1 ? $matches->first() : null;
    }

    /**
     * @param  array<int, string>  $clientIds
     * @return array{sub: string, email: string, name: string}|null
     */
    private function verifyGoogleToken(string $idToken, array $clientIds): ?array
    {
        $response = Http::timeout(10)
            ->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $idToken]);

        if (! $response->successful()) {
            return null;
        }

        $claims = $response->json();

        $audienceOk = in_array($claims['aud'] ?? '', $clientIds, true);
        $issuerOk = in_array($claims['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true);
        $notExpired = (int) ($claims['exp'] ?? 0) > time();
        $emailVerified = filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (! $audienceOk || ! $issuerOk || ! $notExpired || ! $emailVerified || empty($claims['email'])) {
            return null;
        }

        return [
            'sub' => (string) $claims['sub'],
            'email' => (string) $claims['email'],
            'name' => (string) ($claims['name'] ?? ''),
        ];
    }

    private function resolveCountryId(?string $isoCode): ?int
    {
        if ($isoCode) {
            $match = Country::where('code', strtoupper($isoCode))->first();

            if ($match) {
                return $match->id;
            }
        }

        return Country::where('is_active', true)->value('id');
    }

    private function tokenResponse(User $user, string $message, int $status = 200): JsonResponse
    {
        // Newly created rows carry their defaults (wallet, score) only in the
        // database until reloaded — the app types those as numbers, not null.
        $user->refresh();

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $user->createToken('mobile')->plainTextToken,
                'user' => new UserResource($user),
            ],
            'message' => $message,
        ], $status);
    }
}
