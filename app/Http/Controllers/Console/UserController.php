<?php

namespace App\Http\Controllers\Console;

use App\Enums\UserRole;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class UserController extends Controller
{
    use ScopesCountry;

    /** Everyone who is not an admin is one kind of person: a member. */
    private function members()
    {
        return User::query()
            ->whereIn('role', [UserRole::Donor, UserRole::Receiver])
            ->when($this->countryId(), fn ($q) => $q->where('country_id', $this->countryId()));
    }

    private function guardScope(User $user): void
    {
        abort_if($user->isAdmin(), 403);
        abort_if($this->countryId() && $user->country_id !== $this->countryId(), 403);
    }

    public function index(): View
    {
        $users = $this->members()
            ->withCount(['donations', 'orders'])
            ->latest()
            ->paginate(25);

        return view('console.users.index', [
            'title' => 'Members',
            'users' => $users,
        ]);
    }

    /** One place to see and manage everything a member has done. */
    public function show(User $user): View
    {
        $this->guardScope($user);

        $donations = FoodDonation::where('donor_id', $user->id)
            ->with('unit')
            ->latest()
            ->limit(25)
            ->get();

        $requests = Order::where('receiver_id', $user->id)
            ->with('foodDonation')
            ->latest()
            ->limit(25)
            ->get();

        $transactions = WalletTransaction::where('user_id', $user->id)
            ->latest()
            ->limit(40)
            ->get();

        return view('console.users.show', [
            'title' => $user->name,
            'user' => $user,
            'donations' => $donations,
            'requests' => $requests,
            'transactions' => $transactions,
        ]);
    }

    public function toggle(User $user): RedirectResponse
    {
        $this->guardScope($user);

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('toast', $user->is_active ? "{$user->name} activated" : "{$user->name} suspended");
    }

    /** Reward points straight into one member's balance. */
    public function grant(Request $request, User $user): RedirectResponse
    {
        $this->guardScope($user);

        $data = $request->validate([
            'points' => ['required', 'integer', 'min:1', 'max:1000000'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        app(WalletService::class)->credit($user, $data['points'], $data['reason'], $this->grantRef());

        return back()->with('toast', "{$data['points']} points granted to {$user->name}");
    }

    /** Reward the same points to a batch of members at once. */
    public function grantBulk(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'points' => ['required', 'integer', 'min:1', 'max:1000000'],
            'reason' => ['required', 'string', 'max:255'],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer'],
        ]);

        // Only members within the admin's scope can be topped up, whatever the
        // form posted.
        $members = $this->members()->whereIn('id', $data['user_ids'])->get();

        $wallet = app(WalletService::class);

        foreach ($members as $member) {
            $wallet->credit($member, $data['points'], $data['reason'], $this->grantRef());
        }

        return back()->with('toast', "{$data['points']} points granted to {$members->count()} members");
    }

    /** A reference that keeps each grant its own line in the ledger. */
    private function grantRef(): string
    {
        return 'grant:' . auth()->id() . ':' . now()->timestamp . ':' . bin2hex(random_bytes(3));
    }
}
