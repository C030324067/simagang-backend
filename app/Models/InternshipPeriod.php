<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternshipPeriod extends Model
{
    protected $fillable = [
        'division_id',
        'year',
        'quarter',
        'month',
        'monthly_quota',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'quarter' => 'integer',
            'month' => 'integer',
            'monthly_quota' => 'integer',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function applicationsCount(): int
    {
        return InternApplication::query()
            ->where('division_id', $this->division_id)
            ->whereYear('created_at', $this->year)
            ->whereMonth('created_at', $this->month)
            ->count();
    }

    public function isClosed(?int $applicationsCount = null): bool
    {
        $applicationsCount ??= $this->applicationsCount();

        return $applicationsCount >= $this->monthly_quota;
    }
}
