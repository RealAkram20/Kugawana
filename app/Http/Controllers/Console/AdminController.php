<?php

namespace App\Http\Controllers\Console;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function index(): View
    {
        $admins = User::query()
            ->with('country')
            ->where('role', UserRole::CountryAdmin)
            ->orderBy('name')
            ->get();

        return view('console.admins.index', [
            'title' => 'Admins',
            'admins' => $admins,
        ]);
    }

    public function approve(User $user): RedirectResponse
    {
        abort_if($user->role !== UserRole::CountryAdmin, 403);

        $user->update(['is_active' => true]);

        return back()->with('toast', "{$user->name} approved");
    }
}
