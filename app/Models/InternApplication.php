<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'application_type',
        'institution_name',
        'recommendation_letter_number',
        'file_proposal',
        'file_recommendation_letter',
        'file_cv',
        'start_date',
        'end_date',
        'status_kepegawaian',
        'notes_kepegawaian',
        'verified_by_kepegawaian',
        'status_kabid',
        'notes_kabid',
        'verified_by_kabid',
        'status_kadis',
        'notes_kadis',
        'verified_by_kadis',
        'final_status',
        'division_id',
        'acceptance_letter_number',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function verifierKepegawaian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_kepegawaian');
    }

    public function verifierKabid(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_kabid');
    }

    public function verifierKadis(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_kadis');
    }
}

