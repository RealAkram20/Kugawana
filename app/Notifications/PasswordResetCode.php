<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetCode extends Notification
{
    public function __construct(private string $code)
    {
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your Kugawana password reset code')
            ->line('Use this code in the app to reset your password:')
            ->line('## ' . $this->code)
            ->line('The code expires in 30 minutes. If you did not ask to reset your password, you can safely ignore this email.');
    }
}
