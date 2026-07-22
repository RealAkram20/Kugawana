<?php

namespace App\Http\Controllers\Api;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\CommunityLike;
use App\Models\CommunityPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $likedIds = CommunityLike::where('user_id', $request->user()->id)->pluck('community_post_id');

        $posts = CommunityPost::query()
            ->with('user')
            ->where('status', PostStatus::Published)
            ->latest()
            ->limit(50)
            ->get()
            ->each(fn ($post) => $post->liked = $likedIds->contains($post->id));

        return response()->json([
            'success' => true,
            'data' => PostResource::collection($posts),
            'message' => 'Feed retrieved',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $post = CommunityPost::create([
            'user_id' => $request->user()->id,
            'content' => $data['content'],
            'status' => PostStatus::Published,
        ]);

        $post->load('user');

        return response()->json([
            'success' => true,
            'data' => new PostResource($post),
            'message' => 'Posted',
        ], 201);
    }

    public function like(Request $request, CommunityPost $post): JsonResponse
    {
        $existing = CommunityLike::where('community_post_id', $post->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $post->decrement('likes_count');
        } else {
            CommunityLike::create([
                'community_post_id' => $post->id,
                'user_id' => $request->user()->id,
            ]);
            $post->increment('likes_count');
        }

        return response()->json([
            'success' => true,
            'data' => ['likes_count' => $post->fresh()->likes_count],
            'message' => 'Updated',
        ]);
    }
}
