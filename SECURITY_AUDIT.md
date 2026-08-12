# Kugawana — Security & Bug Audit

**Date:** 2026-08-05
**Scope:** Admin console (Laravel/Blade), mobile REST API, and the Expo/React Native app.
**Method:** Full read of every console + API controller, the services (wallet, reward, food-split), auth flows, middleware, routes, models, Blade views, the mobile app source, and git history for secrets. Every High finding below was re-verified by hand against the current code.

> ## STATUS — 2026-08-05, fixes applied
>
> **Fixed and verified (local + production):** H1, H2, H3, H4, H5, M1, M2, M3, M4, M6, M7, M8, L1.
> Each money fix was proven with a functional test (double-cancel refunds once, cancelled orders
> refuse re-accept, unsplit restores the batch price, foreign image paths are stripped).
>
> **Also fixed, found during verification (pre-existing, not in the original audit):** unauthenticated
> `/api/*` requests without a JSON `Accept` header returned **500** instead of 401, because the web
> handler looked for a nonexistent `login` route. `bootstrap/app.php` now forces JSON rendering for
> `api/*`. A stale `phpunit.xml` `APP_URL` (carrying the XAMPP subfolder) was also breaking the test
> suite; pinned to a bare host, suite is green.
>
> **Still open — deliberately deferred:** the CRITICAL host-header injection (H0 below) and the other
> deployment-hardening items (Secure cookie, security headers, `.htaccess` deny rules, `APP_DEBUG`),
> plus M5 (article HTML sanitization), M9 (global-content permissions), L2–L7 and the informational
> items. These are either production-environment concerns or need a product decision.

**Headline:** The country-scoping and payment foundations are sound (Pesapal is verified server-to-server, order placement is race-safe, no committed secrets, tokens are in the keychain, HTTPS in prod). The real problems are a cluster of **points/money integrity bugs** where one code path locks correctly and its sibling doesn't, plus a few **cross-country data leaks** to country admins. Fix the four Highs first — each lets a normal user mint points or corrupt stock.

---

## CRITICAL / HIGH

### H0 — Host-header injection (STILL OPEN — production hardening)
**Files:** `bootstrap/app.php` (no `trustHosts()` anywhere in the app — grep-confirmed), `public/sw.js:36-48`
**Verified:** The app trusts the incoming `Host` header when building absolute URLs. Reproduced live:
```
curl -H "Host: evil.example" http://127.0.0.1/Kugawana/console/login
→ href="http://evil.example/Kugawana/css/console.css"
```
**Consequence (mechanism verified, full email chain not executed):** `Password::sendResetLink()` builds its
link from `route('password.reset')` and the notification is not queued, so it renders inside the attacker's
request. An attacker who knows an admin's email can POST to forgot-password with a spoofed `Host`; the admin
receives a genuine reset email whose link points at the attacker's domain **carrying a valid token**. One
click leaks it. Rate limiting doesn't help — one request is enough.
Separately, `AdminNotifier` alert URLs are built inside member-controlled API requests, and `sw.js` calls
`clients.openWindow(target)` on the notification's `url` with **no origin check** — so a poisoned URL
navigates an admin's browser to an arbitrary origin from a trusted-looking system notification.
**Fix:**
```php
// bootstrap/app.php
->withMiddleware(fn (Middleware $m) => $m->trustHosts(at: ['kugawana.app']))
// or, in AppServiceProvider::boot()
URL::forceRootUrl(config('app.url'));
```
and in `public/sw.js`, reject any `target` that is not same-origin before opening it.
**Why deferred:** this only bites on the live host and the fix changes how every URL in the app is built —
worth doing as a deliberate production-hardening pass with a deploy you can watch, not bundled into an
app-logic fix batch.

### H1 — Order cancel double-refunds points (API). Unlimited points from nothing. ✅ FIXED
**File:** `app/Http/Controllers/Api/OrderController.php:86-120`
**Bug:** `cancel()` checks `status` *outside* the transaction (line 90), then inside the transaction updates status and refunds **without a row lock or re-check**. `WalletService::deduct` locks the user row; this refund path does not.
**Exploit:** Place an order costing N points, then fire two simultaneous `POST /orders/{id}/cancel`. Both read status `Pending`, both pass the guard, both credit N → wallet gains **2N** for one order. Repeatable → unlimited points.
**Fix:** Move the guard inside the transaction under a lock, and only refund if the row actually transitioned:
```php
DB::transaction(function () use ($order, $wallet, $splitter) {
    $locked = Order::whereKey($order->id)
        ->whereIn('status', [OrderStatus::Pending, OrderStatus::Accepted])
        ->lockForUpdate()->first();
    if (! $locked) return;                 // already cancelled/completed
    $locked->update(['status' => OrderStatus::Cancelled]);
    if ($locked->points_spent > 0) {
        $wallet->credit($locked->receiver, $locked->points_spent, 'order refund', (string) $locked->id);
    }
    // ...release/republish using $locked...
});
```
The console equivalent (`Console/OrderController::cancelOrder`) already does exactly this — copy that pattern.

### H2 — Console accept/deliver can resurrect a cancelled+refunded order. Double-spend. ✅ FIXED
**File:** `app/Http/Controllers/Console/OrderController.php:81-114`
**Bug:** `accept()` and `deliver()` have **no status guard** — they update to Accepted/Completed unconditionally. The group handlers (`acceptGroup`/`deliverGroup`) filter on status; the single-order paths were never given the same check.
**Exploit:** Admin cancels an order (points refunded, unit released), then presses browser Back on the stale list — which still shows the Accept button — and clicks Accept, or replays `POST /console/orders/{id}/accept`. The order returns to Accepted/Completed: the receiver keeps the refunded points **and** the food, and the released unit is double-allocated.
**Fix:** Lock and re-check status in each, mirroring `cancelOrder()`:
```php
$locked = Order::whereKey($order->id)->lockForUpdate()->first();
if ($locked->status !== OrderStatus::Pending)  return back()->with('toast', 'That order is no longer pending');   // accept()
if ($locked->status !== OrderStatus::Accepted) return back()->with('toast', 'That order is not awaiting delivery'); // deliver()
```

### H3 — Google sign-in reclaim clears the password but never revokes tokens. Account takeover survives. ✅ FIXED
**File:** `app/Http/Controllers/Api/AuthController.php:166-182`
**Bug:** When Google proves ownership of a pre-registered *unverified* account, the code nulls the password (line 178) to lock out whoever set it — but does not revoke that person's existing Sanctum tokens. Because `verify_users_enabled` defaults to **false**, `register()` issues a working token immediately, so a pre-registrant holds a live token.
**Exploit:** Attacker registers with the victim's email + their own password (verification off → gets a bearer token). Victim later signs in with Google; account links, password nulled — but the attacker's **token stays valid**, retaining full access to the now-verified victim account (wallet, orders, profile).
**Fix:** Revoke tokens when clearing the password:
```php
if (! $user->hasVerifiedEmail() && $user->password) {
    $updates['password'] = null;
    $user->tokens()->delete();   // <-- add
}
```

### H4 — Arbitrary file deletion on the public disk via `remove_images[]`. ✅ FIXED
**File:** `app/Http/Controllers/Console/DonationController.php:275` (validation), `:319-331` (`reconcileImages`)
**Bug:** `remove_images.*` is validated only as `string`. `reconcileImages` then `Storage::disk('public')->delete($path)` for every submitted value **without checking the path belongs to this donation**.
**Exploit:** Any admin (incl. a scoped country admin editing their own donation) POSTs `remove_images[]=branding/<logo>.png` or another donation's `food/<hash>.jpg`. Everything is on the same `public` disk, so they can wipe the site logo/favicon, article covers, and other countries' donation photos. (Flysystem blocks `../` out of the disk, so damage is contained to the public disk — but unrestricted within it.)
**Fix:** Intersect requested removals with the donation's own images before deleting:
```php
$remove = array_values(array_intersect($remove, $donation->images ?? []));
```

### H5 — Donation split credits food to any user id (cross-country write + user-enumeration oracle). ✅ FIXED
**File:** `app/Http/Controllers/Console/DonationController.php:397-409` (`resolveSource`), from `split()`
**Bug:** `resolveSource()` does `User::find($data['source_id'])` with **no country/role check**. Its sibling `resolveDonor()` (the newer Add-food path) has the guard; the older split path does not. `FoodSplitService::split()` then writes that user as the batch `donor_id`.
**Exploit:** A country admin splits their own donation with `source_id=<any user id>`. The donation's `donor_id` is reassigned to a member in another country (or another admin), whose name/phone then render back on the donations screens — an id-enumeration oracle over the whole `users` table — and whose donor stats are polluted.
**Fix:** Scope it like `resolveDonor`:
```php
$source = User::whereIn('role', [UserRole::Donor, UserRole::Receiver])->find($data['source_id']);
abort_if($source && $this->countryId() && $source->country_id !== $this->countryId(), 403);
return $source;
```

---

## MEDIUM

### M1 — Points can be minted by farming donation rewards on fake, self-completed listings. ✅ FIXED
**File:** `app/Http/Controllers/Api/FoodController.php:110-121`; `FoodDonation::donorCanManage()` (Pending/Reviewed)
**Bug:** `complete()` awards the `'donation'` reward while the food is still `Pending`/`Reviewed` — before any admin approval or real handover. The reward reference is `donation:{id}`, unique per listing, so idempotency never blocks repeats.
**Exploit (when a "donation" reward campaign is active):** loop `POST /food` (junk, no photo) → `POST /food/{id}/complete`, minting campaign points per fake listing with no verification.
**Fix:** Only award on a genuine, admin-confirmed handover — award from the console approval/receipt flow, or require `approved_at`/`status = Published` before awarding in `complete()`.

### M2 — Undoing a split doesn't restore the price; whole batch sells at the per-unit price. ✅ FIXED
**File:** `app/Services/FoodSplitService.php:67-78` (`unsplit`) vs `:57` (`split` overwrites `points_required` with the per-unit price)
**Exploit:** A 10 Kg donation at 50 pts is split into ten 1 Kg units at 5 pts each (`points_required` → 5). With nothing claimed, the admin undoes the split. The listing is a whole 10 Kg batch costing **5 points** — a receiver gets the entire donation for a tenth of its value.
**Fix:** Persist the pre-split batch price (add a `batch_points_required` column, set it in `split()`, restore it in `unsplit()`); or have `unsplit()` drop the listing to a non-published status so an admin must re-price before it goes live.

### M3 — Dashboard & Reports leak other countries' data to country admins. ✅ FIXED
**Files:** `app/Http/Controllers/Console/DashboardController.php:35-38, 58-67`; `app/Http/Controllers/Console/ReportController.php:27-29`
**Bug:** Donations are country-scoped, but "orders completed", points/revenue sums, and the **activity feed** (which prints `"{name} requested {points} points"` / `"{name} ordered {title}"`) are **not**. A country admin sees other countries' member names, order contents, and global revenue — data they're 403'd from reaching elsewhere.
**Fix:** Apply the same scope the donations query uses:
```php
Order::whereNotNull('completed_at')->when($countryId, fn ($q) => $q->whereHas('foodDonation', fn ($f) => $f->where('country_id', $countryId)))->count();
WalletTopup::...->when($countryId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('country_id', $countryId)));
```

### M4 — `GET /food/{id}` leaks any listing regardless of status/owner/country. ✅ FIXED
**File:** `app/Http/Controllers/Api/FoodController.php:56-69`
**Bug:** `show()` binds any `FoodDonation` with no published/owner/country gate (only `index`/`mine` are scoped). Any user can enumerate IDs and read `Pending`/`Rejected`/other-country donations, exposing `pickup_address`, donor name, and images.
**Fix:** `abort_unless($food->status === FoodStatus::Published || $request->user()?->id === $food->donor_id, 404);`

### M5 — Article body stored as unsanitized HTML, shown to all app users; any country admin can author.
**Files:** `app/Http/Controllers/Console/LearnController.php` (content validated as plain string), `app/Http/Resources/ArticleResource.php:17` (raw), routes under `console.admin` not `console.super`
**Bug:** Article `content` is stored verbatim ("Simple HTML is kept") and served to every user across all countries. No server-side sanitization. If the app renders it as HTML/WebView, a malicious/compromised country admin can plant stored XSS reaching the whole user base.
**Fix:** Sanitize on input with an allow-list (e.g. HTMLPurifier limited to `p,h3,ul,ol,li,b,strong,em,a`), and/or render as sanitized markdown in the app; restrict authoring to super admins.

### M6 — Non-published community posts still readable/interactable by ID (moderation bypass). ✅ FIXED
**File:** `app/Http/Controllers/Api/CommunityController.php` — `show`/`like`/`comment`/`replies`
**Bug:** `index` filters `status = Published`, but the by-ID actions bind the post raw. A hidden/removed post is still fetchable and can still be liked/commented.
**Fix:** `abort_unless($post->status === PostStatus::Published, 404);` at the top of each.

### M7 — Required phone step (after Google sign-in) is bypassable client-side. ✅ FIXED
**Files:** `KugawanaApp/src/app/(tabs)/_layout.tsx:69`; gate only in `src/app/index.tsx` + login/register redirects
**Bug:** The "phone is required" rule lives only in the splash and post-sign-in redirect. The `(tabs)` layout checks only `token`, so a Google user with no phone can open a deep link (`kugawanaapp://(tabs)` or `.../food/123`) and skip the screen.
**Fix:** Enforce server-side (reject member actions until `phone` is set) — the client gate can't be authoritative. Also harden the client: in `(tabs)/_layout.tsx`, `if (hydrated && token && user && !user.phone) return <Redirect href="/(auth)/phone" />`.

### M8 — `warehouse_id` accepted without country scope on donation create/edit/approve. ✅ FIXED
**File:** `app/Http/Controllers/Console/DonationController.php:133, 271, 416`
**Bug:** `Rule::exists('warehouses','id')` with no country constraint, while `country_id` is force-pinned. A country admin can attach another country's warehouse; its name/address then leak on the donation screen and inflate that warehouse's stock count.
**Fix:** `Rule::exists('warehouses','id')->where(fn ($q) => $q->where('is_active', true)->when($this->countryId(), fn ($w) => $w->where('country_id', $this->countryId())))` in all three.

### M9 — Global content deletable/rewritable by any single country admin.
**Files:** routes `console.admin` group — `support.pages.*`, `support.faqs.*`, `support.contact.*`, `categories.*`, `learn.*`
**Bug:** These are global (no `country_id`) yet editable by any country admin. One admin can delete the Terms/Privacy page linked from every app, or repoint the global support email/phone/WhatsApp to an address they control.
**Fix:** Move the global/destructive routes into the existing `console.super` group, leaving country admins read-only on global content.

---

## LOW

- **L1 — Push-token takeover.** ✅ FIXED — `NotificationController::registerToken` keys `updateOrCreate` on the token string alone, so posting another device's Expo token reassigns it. Delete-and-recreate when the token belongs to a different user instead. `app/Http/Controllers/Api/NotificationController.php:85`
- **L2 — Member/rating profile enumeration.** `MemberController::show` and `RatingController::forMember` bind any user id (incl. suspended/other-country/admins), unlike `index`. Scope to active Donors/Receivers or 404.
- **L3 — Split/unsplit TOCTOU.** `DonationController::split`/`unsplit` read `unitsClaimed()` then write without a lock, racing a receiver's `claim`. Wrap in `DB::transaction` + `lockForUpdate`.
- **L4 — Reward idempotency not atomic.** `RewardService::award` does `exists()` then `credit()` unlocked; concurrent calls double-award. Add a unique index on `wallet_transactions(user_id, reference)` and catch the duplicate-key error.
- **L5 — Donation edit allows a past `expiry_date`.** `store()` requires `after:now`; `update()` only `date`. Add `after_or_equal:today`.
- **L6 — Console remember-me forced on.** `Console/AuthController::login` hardcodes `Auth::attempt($creds, true)`. Use `$request->boolean('remember')`.
- **L7 — Cross-country food/member listings.** `FoodController::index` and `MemberController::index` aren't country-filtered. Confirm whether cross-country browsing is intended; if not, add `->where('country_id', $request->user()->country_id)`.

---

## INFORMATIONAL / DEFENSE-IN-DEPTH

- **User `$fillable` too broad.** `role`, `is_active`, `country_id`, `wallet_balance`, `responsibility_score` are mass-assignable. **Not currently exploitable** (every write path uses explicit/validated arrays — confirmed), but one future `User::update($request->all())` becomes instant privilege escalation. Move these to `$guarded` or a FormRequest.
- **Firebase Admin key in the app working tree.** `KugawanaApp/.secrets/firebase-service-account.json` is a live full-admin key. Correctly gitignored and never committed, but it belongs on the server, not the client repo. Relocate it, and rotate the key in Google Cloud IAM if it may have been synced/shared.
- **Sanctum tokens minted with wildcard abilities** — fine for a single-purpose mobile token; no defense-in-depth if one leaks.
- **Favicon validated by extension only** (`BrandingController`); low risk since it's served as a static file, never executed.
- **Pesapal WebView** (`PesapalCheckout.tsx`) matches the callback URL by substring and has no `originWhitelist`; settlement is verified server-side so impact is cosmetic. Tighten the match + add `originWhitelist={['https://*']}`.

---

## VERIFIED SAFE (coverage confirmed)

- **Pesapal IPN/callback** (unauthenticated by design) is **not forgeable** — the handler ignores the request body and re-queries Pesapal server-to-server before crediting, and is idempotent under `lockForUpdate`.
- **Order placement is transactional and race-safe** — `claim` is an atomic conditional decrement (last unit can't be oversold), `deduct` locks the user row and refuses to go negative, and a failed debit rolls back the claim.
- **No SQL injection** — the few raw expressions are constant strings or bound `int` params; search filters use bound `like` values.
- **CSRF** — no exemptions; all state changes are POST/DELETE with `@csrf`.
- **No committed secrets** — root `.env` is gitignored and never in history; only public client IDs (`google-services.json`, `EXPO_PUBLIC_*`) are tracked, which is expected.
- **Token storage** — bearer token in `expo-secure-store` (OS keychain), stripped from AsyncStorage; **HTTPS** on preview/production (the LAN IP is dev-only); 401 clears the session.
- **Google token verification** — audience, issuer, `exp`, and `email_verified` all checked.
- **Password reset & login** — constant neutral responses (no account enumeration), throttled, session regenerated on login, admin-only reset links.
- **Object-level authZ** — country scoping (`ScopesCountry`/`guardScope`) and ownership checks (`authorizeReceiver`/`authorizeOwner`) are applied consistently across the console and API; no super-admin route reachable by a country admin.

---

## Suggested fix order

1. **H1, H2** (points double-refund / order resurrection) — money integrity, both are copy-the-locked-pattern.
2. **H3** (token revocation on Google reclaim) — one line.
3. **H4** (file deletion) — one line.
4. **H5, M8** (donation source / warehouse country scope) — small, same shape.
5. **M1, M2** (reward farming, split re-pricing) — need a small design decision each.
6. **M3, M4, M6** (data-leak scoping) — mechanical `->when($countryId, …)` / `abort_unless`.
7. **M5, M7, M9** (article XSS, phone gate, global-content permissions) — each is a small policy/sanitization change.
8. Low / informational as capacity allows.
