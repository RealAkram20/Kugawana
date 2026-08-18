<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\SupportPage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class SupportPageController extends Controller
{
    public function index(): View
    {
        return view('console.support.pages.index', [
            'title' => 'Policy pages',
            'pages' => SupportPage::orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['sort_order'] = $data['sort_order'] ?: ((int) SupportPage::max('sort_order') + 1);

        SupportPage::create($data);

        return redirect()->route('console.support.pages.index')->with('toast', "{$data['title']} created");
    }

    public function edit(SupportPage $page): View
    {
        return view('console.support.pages.edit', [
            'title' => 'Edit page',
            'page' => $page,
        ]);
    }

    public function update(Request $request, SupportPage $page): RedirectResponse
    {
        $page->update($this->validated($request, $page));

        return redirect()->route('console.support.pages.index')->with('toast', "{$page->title} updated");
    }

    public function toggle(SupportPage $page): RedirectResponse
    {
        $page->update(['is_published' => ! $page->is_published]);

        return back()->with('toast', $page->is_published ? "{$page->title} published" : "{$page->title} hidden");
    }

    public function destroy(SupportPage $page): RedirectResponse
    {
        $page->delete();

        return redirect()->route('console.support.pages.index')->with('toast', 'Page deleted');
    }

    private function validated(Request $request, ?SupportPage $page = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable', 'string', 'max:255', 'alpha_dash',
                Rule::unique('support_pages', 'slug')->ignore($page?->id),
            ],
            'body' => ['required', 'string', 'max:50000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        // The slug is what the app links to, so fall back to the title rather than
        // letting a blank field through. A nullable field that was never submitted
        // is absent from the validated array, not null — hence the ?? as well.
        $data['slug'] = Str::slug(($data['slug'] ?? null) ?: $data['title']);
        $data['is_published'] = $request->boolean('is_published');
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        return $data;
    }
}
