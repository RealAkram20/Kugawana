<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\FoodCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CategoryController extends Controller
{
    public function index(): View
    {
        $categories = FoodCategory::withCount('donations')->orderBy('name')->get();

        return view('console.categories.index', [
            'title' => 'Categories',
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:food_categories,name'],
        ]);

        FoodCategory::create(['name' => $data['name'], 'is_active' => true]);

        return back()->with('toast', "{$data['name']} added");
    }

    public function toggle(FoodCategory $category): RedirectResponse
    {
        $category->update(['is_active' => ! $category->is_active]);

        return back()->with('toast', $category->is_active ? "{$category->name} enabled" : "{$category->name} disabled");
    }
}
