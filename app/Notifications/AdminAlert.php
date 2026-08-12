<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * An operational alert for the console team. Delivered as a browser push so an
 * admin is told the moment something needs a response, an email so it reaches
 * them away from the console too, and kept as a database row so the same event
 * survives a missed or dismissed notification.
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
        // Mail deliberately last: a slow or misconfigured SMTP server must not
        // stop the browser push, which is the prompt-response channel.
        return ['database', WebPushChannel::class, 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("[Kugawana] {$this->title}")
            ->greeting($this->title)
            ->line($this->body);

        if ($this->url) {
            $mail->action('Open the console', $this->url);
        }

        return $mail->line('You are receiving this because you are a Kugawana admin.');
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
