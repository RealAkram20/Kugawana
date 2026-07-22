<?php

namespace App\Http\Controllers\Console;

use App\Enums\UserRole;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class UserController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $users = User::query()
            ->whereIn('role', [UserRole::Donor, UserRole::Receiver])
            ->when($this->countryId(), fn ($q) => $q->where('country_id', $this->countryId()))
            ->latest()
            ->paginate(25);

        return view('console.users.index', [
            'title' => 'Users',
            'users' => $users,
        ]);
    }

    public function toggle(User $user): RedirectResponse
    {
        abort_if($user->isAdmin(), 403);

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('toast', $user->is_active ? "{$user->name} activated" : "{$user->name} suspended");
    }
}
