<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'intern_application_id',
        'mentor_id',
        'task_average',
        'attendance_percentage',
        'final_score',
        'remarks',
        'score_discipline',
        'score_quality',
        'score_initiative',
        'score_teamwork',
        'score_softskill',
        'score_responsibility',
        'grade_letter',
        'notes',
        'evaluated_at',
    ];

    protected function casts(): array
    {
        return [
            'task_average' => 'decimal:2',
            'attendance_percentage' => 'decimal:2',
            'final_score' => 'decimal:2',
            'score_discipline' => 'decimal:2',
            'score_quality' => 'decimal:2',
            'score_initiative' => 'decimal:2',
            'score_teamwork' => 'decimal:2',
            'score_softskill' => 'decimal:2',
            'score_responsibility' => 'decimal:2',
            'evaluated_at' => 'datetime',
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

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }
}
