<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class LearnController extends Controller
{
    /** The learning topics the mobile app groups articles under. */
    public const CATEGORIES = [
        'preservation' => 'Food preservation',
        'nutrition' => 'Nutrition',
        'handling' => 'Safe handling',
        'waste' => 'Reducing waste',
        'community' => 'Community guides',
    ];

    public function index(): View
    {
        $articles = Article::latest()->paginate(25);

        return view('console.learn.index', [
            'title' => 'Learn',
            'articles' => $articles,
        ]);
    }

    public function create(): View
    {
        return view('console.learn.form', [
            'title' => 'New article',
            'article' => new Article,
            'categories' => self::CATEGORIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $article = Article::create($this->validated($request));

        return redirect()
            ->route('console.learn.index')
            ->with('toast', "{$article->title} saved");
    }

    public function edit(Article $article): View
    {
        return view('console.learn.form', [
            'title' => 'Edit article',
            'article' => $article,
            'categories' => self::CATEGORIES,
        ]);
    }

    public function update(Request $request, Article $article): RedirectResponse
    {
        $article->update($this->validated($request, $article));

        return redirect()
            ->route('console.learn.index')
            ->with('toast', "{$article->title} updated");
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Article $article = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(array_keys(self::CATEGORIES))],
            'content' => ['required', 'string'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $data['is_published'] = $request->boolean('is_published');

        // The upload arrives as a file, never a string path — swap it for the
        // stored path, cleaning up the image it replaces.
        unset($data['cover_image']);

        if ($request->hasFile('cover_image')) {
            if ($article?->cover_image) {
                Storage::disk('public')->delete($article->cover_image);
            }

            $data['cover_image'] = $request->file('cover_image')->store('articles', 'public');
        }

        return $data;
    }
}
