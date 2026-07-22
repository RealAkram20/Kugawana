---
name: kugawana-backend
description: Laravel 12 backend patterns for the Kugawana API. Use whenever building models, controllers, routes, jobs, or any backend logic for Kugawana. Read kugawana-project first for business rules and food lifecycle states.
---

# Kugawana Backend

Read `kugawana-project` SKILL.md before this one.

## Stack

- Laravel 12
- Laravel Sanctum (API auth)
- MySQL
- Laravel Queues (database driver initially)
- Laravel Scheduler (expiry jobs)
- REST API (JSON responses)

## Project Structure

```
app/
  Http/
    Controllers/
      Api/
        AuthController.php
        FoodController.php
        OrderController.php
        WalletController.php
        CommunityController.php
        LearnController.php
        ProfileController.php
    Middleware/
      RoleMiddleware.php
    Resources/
      FoodResource.php
      OrderResource.php
      UserResource.php
  Models/
    User.php
    FoodDonation.php
    FoodCategory.php
    Order.php
    Warehouse.php
    PointPackage.php
    WalletTransaction.php
    CommunityPost.php
    Article.php
    Rating.php
    RewardCampaign.php
  Jobs/
    ExpireOverdueFoodJob.php
    SendNotificationJob.php
  Policies/
    FoodPolicy.php
    OrderPolicy.php
  Enums/
    FoodStatus.php
    OrderStatus.php
    UserRole.php
    TransactionType.php
routes/
  api.php
database/
  migrations/
  seeders/
```

## Enums

```php
enum FoodStatus: string {
    case Pending = 'pending';
    case Reviewed = 'reviewed';
    case Approved = 'approved';
    case Collected = 'collected';
    case Stored = 'stored';
    case Published = 'published';
    case Reserved = 'reserved';
    case Delivered = 'delivered';
    case Completed = 'completed';
    case Rejected = 'rejected';
    case Expired = 'expired';
}

enum UserRole: string {
    case SuperAdmin = 'super_admin';
    case CountryAdmin = 'country_admin';
    case Donor = 'donor';
    case Receiver = 'receiver';
}

enum OrderStatus: string {
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
```

## Authentication

Sanctum token-based auth. All API routes under `auth:sanctum` middleware.

```php
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/auth/google', [AuthController::class, 'googleAuth']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::apiResource('food', FoodController::class);
    Route::apiResource('orders', OrderController::class);
    Route::get('/wallet', [WalletController::class, 'index']);
    Route::post('/wallet/purchase', [WalletController::class, 'purchase']);
    Route::apiResource('community', CommunityController::class);
    Route::apiResource('learn', LearnController::class)->only(['index', 'show']);
    Route::apiResource('ratings', RatingController::class)->only(['store']);
});
```

## API Response Format

All responses follow this shape:

```php
return response()->json([
    'success' => true,
    'data' => $resource,
    'message' => 'Food retrieved successfully',
], 200);
```

Errors:

```php
return response()->json([
    'success' => false,
    'message' => 'Food not found',
    'errors' => $validator->errors(),
], 422);
```

## Role Middleware

```php
class RoleMiddleware {
    public function handle(Request $request, Closure $next, string ...$roles): Response {
        if (!in_array($request->user()->role->value, $roles)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        return $next($request);
    }
}
```

Usage in routes:

```php
Route::middleware(['auth:sanctum', 'role:super_admin,country_admin'])->group(function () {
    Route::post('/food/{food}/approve', [FoodController::class, 'approve']);
});
```

## Expiry Scheduler

```php
class ExpireOverdueFoodJob implements ShouldQueue {
    public function handle(): void {
        FoodDonation::where('status', FoodStatus::Published)
            ->where('expiry_date', '<', now())
            ->update(['status' => FoodStatus::Expired]);
    }
}
```

In `routes/console.php`:

```php
Schedule::job(new ExpireOverdueFoodJob)->everyFifteenMinutes();
```

## Food Donation Model (key relationships)

```php
class FoodDonation extends Model {
    protected $casts = [
        'status' => FoodStatus::class,
        'images' => 'array',
        'expiry_date' => 'datetime',
        'pickup_location' => 'array',
    ];

    public function donor(): BelongsTo {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function category(): BelongsTo {
        return $this->belongsTo(FoodCategory::class);
    }

    public function warehouse(): BelongsTo {
        return $this->belongsTo(Warehouse::class);
    }

    public function orders(): HasMany {
        return $this->hasMany(Order::class);
    }

    public function scopePublished(Builder $query): Builder {
        return $query->where('status', FoodStatus::Published)
                     ->where('expiry_date', '>', now());
    }
}
```

## Wallet and Points

Point transactions always go through a service, never update the wallet directly from a controller.

```php
class WalletService {
    public function deduct(User $user, int $points, string $reason): void {
        if ($user->wallet_balance < $points) {
            throw new InsufficientPointsException();
        }
        $user->decrement('wallet_balance', $points);
        WalletTransaction::create([
            'user_id' => $user->id,
            'type' => TransactionType::Debit,
            'points' => $points,
            'reason' => $reason,
        ]);
    }

    public function credit(User $user, int $points, string $reason): void {
        $user->increment('wallet_balance', $points);
        WalletTransaction::create([
            'user_id' => $user->id,
            'type' => TransactionType::Credit,
            'points' => $points,
            'reason' => $reason,
        ]);
    }
}
```

## Food Responsibility Score

Tracked on the `users` table as `responsibility_score` (integer, default 100).

Updates fire through model events, not controllers:

```php
class Order extends Model {
    protected static function booted(): void {
        static::updated(function (Order $order) {
            if ($order->isDirty('status')) {
                app(ResponsibilityScoreService::class)->update($order);
            }
        });
    }
}
```

## Notifications

Use Laravel Notifications with the database and FCM channels.

```php
class FoodApprovedNotification extends Notification {
    public function via(object $notifiable): array {
        return ['database', 'fcm'];
    }

    public function toArray(object $notifiable): array {
        return [
            'title' => 'Food approved',
            'body' => "{$this->food->title} has been approved",
            'food_id' => $this->food->id,
        ];
    }
}
```

## Pesapal Integration

Pesapal IPN callback verifies the payment server-side before crediting points. Never credit points client-side.

```php
class PesapalController extends Controller {
    public function callback(Request $request): JsonResponse {
        $verified = $this->pesapalService->verifyPayment($request->OrderTrackingId);
        if ($verified) {
            app(WalletService::class)->credit($request->user(), $verified->points, 'purchase');
        }
        return response()->json(['success' => $verified !== null]);
    }
}
```

## Code Rules

- No comments in any file
- No magic numbers — use constants or config values
- All business logic in Service classes, not controllers
- Controllers handle only HTTP input/output
- Use Form Requests for all validation
- Use API Resources for all JSON output — no raw array returns
