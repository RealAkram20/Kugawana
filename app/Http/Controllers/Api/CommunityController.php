<?php

namespace App\Http\Controllers\Api;

use App\Enums\PostStatus;
use App\Enums\PostType;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\CommunityComment;
use App\Models\CommunityLike;
use App\Models\CommunityPost;
use App\Models\User;
use App\Notifications\KugawanaNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Enum;
use App\Support\MediaUrl;

class CommunityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'type' => ['nullable', new Enum(PostType::class)],
            'q' => ['nullable', 'string', 'max:120'],
        ]);

        $likedIds = CommunityLike::where('user_id', $request->user()->id)->pluck('community_post_id');

        $posts = CommunityPost::query()
            ->with('user')
            ->where('status', PostStatus::Published)
            ->when($filters['type'] ?? null, fn ($query, $type) => $query->where('post_type', $type))
            ->when($filters['q'] ?? null, function ($query, $term) {
                $query->where(function ($inner) use ($term) {
                    $inner->where('content', 'like', "%{$term}%")
                        ->orWhere('location', 'like', "%{$term}%")
                        ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$term}%"));
                });
            })
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

    public function show(Request $request, CommunityPost $post): JsonResponse
    {
        $post->load(['user', 'comments.user']);

        $liked = CommunityLike::where('community_post_id', $post->id)
            ->where('user_id', $request->user()->id)
            ->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $post->id,
                'author_id' => $post->user_id,
                'author_name' => $post->user?->name,
                'profile_photo' => MediaUrl::for($post->user?->profile_photo),
                'content' => $post->content,
                'images' => MediaUrl::all($post->images),
                'post_type' => $post->post_type?->value,
                'location' => $post->location ?? $post->user?->district,
                'time_ago' => $post->created_at->diffForHumans(short: true),
                'likes_count' => (int) $post->likes_count,
                'comments_count' => (int) $post->comments_count,
                'liked' => $liked,
                'comments' => $post->comments->map(fn (CommunityComment $comment) => [
                    'id' => $comment->id,
                    'author_name' => $comment->user?->name,
                    'profile_photo' => MediaUrl::for($comment->user?->profile_photo),
                    'content' => $comment->content,
                    'time_ago' => $comment->created_at->diffForHumans(),
                ]),
            ],
            'message' => 'Post retrieved',
        ]);
    }

    public function comment(Request $request, CommunityPost $post): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $comment = CommunityComment::create([
            'community_post_id' => $post->id,
            'user_id' => $request->user()->id,
            'content' => $data['content'],
        ]);

        $post->increment('comments_count');
        $comment->load('user');

        $this->notifyAuthor(
            $post,
            $request->user(),
            'community.comment',
            'New comment on your post',
            "{$request->user()->name}: ".Str::limit($comment->content, 80)
        );

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $comment->id,
                'author_name' => $comment->user?->name,
                'profile_photo' => MediaUrl::for($comment->user?->profile_photo),
                'content' => $comment->content,
                'time_ago' => $comment->created_at->diffForHumans(),
            ],
            'message' => 'Comment added',
        ], 201);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'post_type' => ['nullable', new Enum(PostType::class)],
            'location' => ['nullable', 'string', 'max:160'],
        ]);

        $post = CommunityPost::create([
            'user_id' => $request->user()->id,
            'content' => $data['content'],
            'post_type' => $data['post_type'] ?? PostType::Discussion->value,
            'location' => $data['location'] ?? null,
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

            // Only on the like itself — un-liking is not news, and repeat
            // like/unlike cycles must not spam the author.
            $this->notifyAuthor(
                $post,
                $request->user(),
                'community.like',
                'Someone liked your post',
                "{$request->user()->name} liked your post."
            );
        }

        return response()->json([
            'success' => true,
            'data' => ['likes_count' => $post->fresh()->likes_count],
            'message' => 'Updated',
        ]);
    }

    /** Notifies a post's author, unless they are the one who acted. */
    private function notifyAuthor(CommunityPost $post, User $actor, string $type, string $title, string $body): void
    {
        $author = $post->user;

        if ($author && $author->id !== $actor->id) {
            $author->notify(new KugawanaNotification($type, $title, $body, 'community', $post->id));
        }
    }
}
