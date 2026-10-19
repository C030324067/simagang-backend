<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'intern_application_id',
        'certificate_number',
        'qr_hash',
        'pdf_path',
        'issued_at',
    ];

    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
        ];
    }

    public function intern(): HasOneThrough
    {
        return $this->hasOneThrough(User::class, InternApplication::class, 'id', 'id', 'intern_application_id', 'user_id');
    }

    public function internApplication(): BelongsTo
    {
        return $this->belongsTo(InternApplication::class);
    }
}
