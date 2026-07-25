<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * An operational alert for the console team. Delivered as a browser push so an
 * admin is told the moment something needs a response, and kept as a database
 * row so the same event survives a missed or dismissed notification.
 */
class AdminAlert extends Notification
{
    use Queueable;

    public function __construct(
        private string $type,
        private string $title,
        private string $body,
        private ?string $url = null,
    ) {
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'url' => $this->url,
        ];
    }

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title($this->title)
            ->body($this->body)
            ->icon(asset('images/notification-icon.png'))
            ->tag($this->type)
            ->data(['url' => $this->url])
            ->options(['TTL' => 3600]);
    }
}
