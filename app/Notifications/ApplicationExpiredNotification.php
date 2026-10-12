<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationExpiredNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $reason,
        private readonly string $deadline,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pendaftaran magang gugur otomatis')
            ->greeting('Yth. '.$notifiable->name)
            ->line('Pendaftaran magang Anda telah ditolak otomatis karena belum mendapat konfirmasi dalam tenggat verifikasi satu minggu.')
            ->line('Tenggat verifikasi: '.$this->deadline)
            ->line($this->reason)
            ->line('Silakan hubungi petugas Diskominfo jika Anda memerlukan informasi lebih lanjut.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pendaftaran magang gugur otomatis',
            'message' => $this->reason,
            'verification_deadline' => $this->deadline,
        ];
    }
}
