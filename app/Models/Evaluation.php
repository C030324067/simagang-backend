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
        'final_score',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'discipline_score' => 'decimal:2',
            'skill_score' => 'decimal:2',
            'softskill_score' => 'decimal:2',
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

