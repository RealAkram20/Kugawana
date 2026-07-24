<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** The bell only ever shows a recent window; older rows stay for the record. */
    private const PAGE = 50;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Unread first, then newest within each group — so anything the member
        // has not opened yet sits at the top of the screen. reorder() clears the
        // created_at ordering the notifications() relation applies by default,
        // which would otherwise stay the primary sort and bury this clause.
        $notifications = $user->notifications()
            ->reorder()
            ->orderByRaw('read_at is null desc')
            ->latest()
            ->limit(self::PAGE)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'type' => $notification->data['type'] ?? 'general',
                'title' => $notification->data['title'] ?? '',
                'body' => $notification->data['body'] ?? '',
                'route' => $notification->data['route'] ?? null,
                'route_id' => $notification->data['route_id'] ?? null,
                'read' => $notification->read_at !== null,
                'time_ago' => $notification->created_at->diffForHumans(),
                'created_at' => $notification->created_at->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $user->unreadNotifications()->count(),
            ],
            'message' => 'Notifications retrieved',
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $request->user()->unreadNotifications()->count()],
            'message' => 'Notification read',
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => 0],
            'message' => 'All notifications read',
        ]);
    }

    /**
     * Claims an Expo push token for the signed-in user. The token is unique, so
     * signing in on a shared handset moves it rather than duplicating it.
     */
    public function registerToken(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:16'],
        ]);

        PushToken::updateOrCreate(
            ['token' => $data['token']],
            ['user_id' => $request->user()->id, 'platform' => $data['platform'] ?? null],
        );

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Push token registered',
        ]);
    }

    public function removeToken(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
        ]);

        PushToken::where('token', $data['token'])
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Push token removed',
        ]);
    }
}
