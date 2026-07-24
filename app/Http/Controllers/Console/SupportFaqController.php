<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SupportFaqController extends Controller
{
    public function index(): View
    {
        return view('console.support.faqs.index', [
            'title' => 'FAQs',
            'faqs' => Faq::orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        // New entries go to the end unless a position was given.
        $data['sort_order'] = $data['sort_order'] ?: ((int) Faq::max('sort_order') + 1);

        Faq::create($data);

        return redirect()->route('console.support.faqs.index')->with('toast', 'Question added');
    }

    public function edit(Faq $faq): View
    {
        return view('console.support.faqs.edit', [
            'title' => 'Edit question',
            'faq' => $faq,
        ]);
    }

    public function update(Request $request, Faq $faq): RedirectResponse
    {
        $faq->update($this->validated($request));

        return redirect()->route('console.support.faqs.index')->with('toast', 'Question updated');
    }

    public function toggle(Faq $faq): RedirectResponse
    {
        $faq->update(['is_published' => ! $faq->is_published]);

        return back()->with('toast', $faq->is_published ? 'Question published' : 'Question hidden');
    }

    public function destroy(Faq $faq): RedirectResponse
    {
        $faq->delete();

        return redirect()->route('console.support.faqs.index')->with('toast', 'Question deleted');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string', 'max:5000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $data['is_published'] = $request->boolean('is_published');
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        return $data;
    }
}
