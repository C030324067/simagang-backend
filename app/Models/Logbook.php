<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Logbook extends Model
{
    use HasFactory;

    protected $fillable = [
        'intern_application_id',
        'date',
        'activity_description',
        'category',
        'attachment',
        'verification_status',
        'mentor_notes',
        'verified_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }

    public function user(): HasOneThrough
    {
        return $this->hasOneThrough(User::class, InternApplication::class, 'id', 'id', 'intern_application_id', 'user_id');
    }

    public function internApplication(): BelongsTo
    {
        return $this->belongsTo(InternApplication::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
