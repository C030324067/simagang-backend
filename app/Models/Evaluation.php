<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'intern_id',
        'mentor_id',
        'discipline_score',
        'skill_score',
        'softskill_score',
        'responsibility_score',
        'task_average',
        'attendance_percentage',
        'final_score',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'discipline_score' => 'decimal:2',
            'skill_score' => 'decimal:2',
            'softskill_score' => 'decimal:2',
            'responsibility_score' => 'decimal:2',
            'task_average' => 'decimal:2',
            'attendance_percentage' => 'decimal:2',
            'final_score' => 'decimal:2',
        ];
    }

    public function intern(): BelongsTo
    {
        return $this->belongsTo(User::class, 'intern_id');
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }
}
