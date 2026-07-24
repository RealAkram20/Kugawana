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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Enum;
use App\Support\MediaUrl;

class CommunityController extends Controller
{
    /** Matches the maxFiles() on the app's photo picker. */
    private const MAX_IMAGES = 4;

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
        // Only thread starters load with the post. Replies stay behind their
        // "View N replies" row so a post with a long argument under one comment
        // does not drag the whole screen down with it.
        $post->load(['user', 'comments' => fn ($query) => $query->topLevel()->with('user')->oldest()]);

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
                'comments' => $post->comments->map(fn (CommunityComment $comment) => $this->commentPayload($comment)),
            ],
            'message' => 'Post retrieved',
        ]);
    }

    /** The replies under one comment, fetched when the thread is expanded. */
    public function replies(CommunityPost $post, CommunityComment $comment): JsonResponse
    {
        abort_if($comment->community_post_id !== $post->id, 404);

        $replies = $comment->replies()->with('user')->oldest()->get();

        return response()->json([
            'success' => true,
            'data' => $replies->map(fn (CommunityComment $reply) => $this->commentPayload($reply)),
            'message' => 'Replies retrieved',
        ]);
    }

    public function comment(Request $request, CommunityPost $post): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:community_comments,id'],
        ]);

        $parent = $this->resolveParent($post, $data['parent_id'] ?? null);

        $comment = DB::transaction(function () use ($post, $parent, $request, $data) {
            $comment = CommunityComment::create([
                'community_post_id' => $post->id,
                'parent_id' => $parent?->id,
                'user_id' => $request->user()->id,
                'content' => $data['content'],
            ]);

            $post->increment('comments_count');
            $parent?->increment('replies_count');

            return $comment;
        });

        $comment->load(['user', 'parent.user']);

        $this->notifyOnComment($post, $comment, $request->user());

        return response()->json([
            'success' => true,
            'data' => $this->commentPayload($comment),
            'message' => 'Comment added',
        ], 201);
    }

    /**
     * Keeps threads two levels deep, the way TikTok does it. Answering a reply
     * files the new comment under the same thread starter instead of nesting
     * one step deeper, so a long back-and-forth never marches off the screen.
     */
    private function resolveParent(CommunityPost $post, ?int $parentId): ?CommunityComment
    {
        if ($parentId === null) {
            return null;
        }

        $parent = CommunityComment::with('parent')->find($parentId);

        // A parent from another post would move the comment across threads.
        if (! $parent || $parent->community_post_id !== $post->id) {
            return null;
        }

        return $parent->isReply() ? $parent->parent : $parent;
    }

    /** @return array<string, mixed> */
    private function commentPayload(CommunityComment $comment): array
    {
        return [
            'id' => $comment->id,
            'parent_id' => $comment->parent_id,
            'author_id' => $comment->user_id,
            'author_name' => $comment->user?->name,
            'profile_photo' => MediaUrl::for($comment->user?->profile_photo),
            'content' => $comment->content,
            'replies_count' => (int) $comment->replies_count,
            'time_ago' => $comment->created_at->diffForHumans(short: true),
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'post_type' => ['nullable', new Enum(PostType::class)],
            'location' => ['nullable', 'string', 'max:160'],
            'images' => ['nullable', 'array', 'max:'.self::MAX_IMAGES],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $post = CommunityPost::create([
            'user_id' => $request->user()->id,
            'content' => $data['content'],
            'post_type' => $data['post_type'] ?? PostType::Discussion->value,
            'location' => $data['location'] ?? null,
            'images' => $this->storeImages($request),
            'status' => PostStatus::Published,
        ]);

        $post->load('user');

        return response()->json([
            'success' => true,
            'data' => new PostResource($post),
            'message' => 'Posted',
        ], 201);
    }

    /**
     * Photos land under community/ on the public disk, beside every other
     * uploaded image, so MediaUrl can turn them into URLs unchanged.
     *
     * @return array<int, string>
     */
    private function storeImages(Request $request): array
    {
        return collect($request->file('images') ?? [])
            ->take(self::MAX_IMAGES)
            ->map(fn ($file) => $file->store('community', 'public'))
            ->values()
            ->all();
    }

    public function like(Request $request, CommunityPost $post): JsonResponse
    {
        $existing = CommunityLike::where('community_post_id', $post->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $post->decrement('likes_count');
            $liked = false;
        } else {
            CommunityLike::create([
                'community_post_id' => $post->id,
                'user_id' => $request->user()->id,
            ]);
            $post->increment('likes_count');
            $liked = true;

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

        // `liked` comes back so every screen showing this post can settle on the
        // server's answer instead of each keeping its own guess.
        return response()->json([
            'success' => true,
            'data' => [
                'liked' => $liked,
                'likes_count' => (int) $post->fresh()->likes_count,
            ],
            'message' => 'Updated',
        ]);
    }

    /**
     * A reply concerns two people: whoever is being answered, and whoever owns
     * the post. They are told once each, and never about their own doing.
     */
    private function notifyOnComment(CommunityPost $post, CommunityComment $comment, User $actor): void
    {
        $excerpt = "{$actor->name}: ".Str::limit($comment->content, 80);
        $told = [$actor->id];

        $repliedTo = $comment->parent?->user;

        if ($repliedTo && ! in_array($repliedTo->id, $told, true)) {
            $repliedTo->notify(new KugawanaNotification(
                'community.reply',
                'New reply to your comment',
                $excerpt,
                'community',
                $post->id,
            ));
            $told[] = $repliedTo->id;
        }

        $author = $post->user;

        if ($author && ! in_array($author->id, $told, true)) {
            $author->notify(new KugawanaNotification(
                'community.comment',
                'New comment on your post',
                $excerpt,
                'community',
                $post->id,
            ));
        }
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
