<?php

namespace App\Mail;

use App\Models\InternApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class OfficialAcceptanceLetter extends Mailable
{
    use Queueable;

    public function __construct(
        public InternApplication $application,
        public string $letterPath,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Surat Penerimaan Magang SIMAGANG');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.official-acceptance-letter',
            with: ['application' => $this->application],
        );
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        $extension = strtolower(pathinfo($this->letterPath, PATHINFO_EXTENSION));
        $mimeType = match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            default => 'application/pdf',
        };

        return [
            Attachment::fromStorageDisk('public', $this->letterPath)
                ->as("Surat-Penerimaan-Magang.{$extension}")
                ->withMime($mimeType),
        ];
    }
}
