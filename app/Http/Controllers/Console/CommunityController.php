<?php

namespace App\Http\Controllers\Console;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Models\CommunityPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class CommunityController extends Controller
{
    public function index(): View
    {
        $posts = CommunityPost::query()
            ->with('user')
            ->latest()
            ->paginate(20);

        return view('console.community.index', [
            'title' => 'Community',
            'posts' => $posts,
        ]);
    }

    public function keep(CommunityPost $post): RedirectResponse
    {
        $post->update(['status' => PostStatus::Published]);

        return back()->with('toast', 'Post kept');
    }

    public function remove(CommunityPost $post): RedirectResponse
    {
        $post->update(['status' => PostStatus::Hidden]);

        return back()->with('toast', 'Post removed');
    }
}
