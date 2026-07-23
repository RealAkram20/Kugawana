<?php

namespace App\Notifications;

use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Every in-app notification the mobile client understands. `route` and
 * `route_id` tell the app which screen to open when the row is tapped, so a new
 * kind of notification needs no client release.
 */
class KugawanaNotification extends Notification
{
    use Queueable;

    public function __construct(
        private string $type,
        private string $title,
        private string $body,
        private ?string $route = null,
        private int|string|null $routeId = null,
    ) {
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'route' => $this->route,
            'route_id' => $this->routeId,
        ];
    }

    /** @return array{title: string, body: string, data: array<string, mixed>} */
    public function toExpo(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'data' => [
                'type' => $this->type,
                'route' => $this->route,
                'route_id' => $this->routeId,
            ],
        ];
    }
}
