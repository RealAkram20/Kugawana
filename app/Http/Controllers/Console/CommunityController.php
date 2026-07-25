<?php

namespace App\Http\Controllers\Console;

use App\Enums\PostStatus;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\CommunityPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class CommunityController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $posts = CommunityPost::query()
            ->with('user')
            ->when($this->countryId(), fn ($q) => $q->whereHas('user', fn ($u) => $u->where('country_id', $this->countryId())))
            ->latest()
            ->paginate(20);

        return view('console.community.index', [
            'title' => 'Community',
            'posts' => $posts,
        ]);
    }

    public function keep(CommunityPost $post): RedirectResponse
    {
        $this->guardScope($post);

        $post->update(['status' => PostStatus::Published]);

        return back()->with('toast', 'Post kept');
    }

    public function remove(CommunityPost $post): RedirectResponse
    {
        $this->guardScope($post);

        $post->update(['status' => PostStatus::Hidden]);

        return back()->with('toast', 'Post removed');
    }

    /** A CountryAdmin may only moderate posts from their own country's users. */
    private function guardScope(CommunityPost $post): void
    {
        $countryId = $this->countryId();

        abort_if($countryId && $post->user?->country_id !== $countryId, 403);
    }
}
