<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class InternshipPeriod extends Model
{
    protected $fillable = [
        'division_id',
        'year',
        'quarter',
        'month',
        'monthly_quota',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'quarter' => 'integer',
            'month' => 'integer',
            'monthly_quota' => 'integer',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function applicationsCount(): int
    {
        $timezone = config('app.timezone');
        $start = Carbon::create($this->year, $this->month, 1, 0, 0, 0, $timezone);
        $end = $start->copy()->addMonth();

        return InternApplication::query()
            ->where('division_id', $this->division_id)
            ->where('created_at', '>=', $start)
            ->where('created_at', '<', $end)
            ->count();
    }

    public function isClosed(?int $applicationsCount = null): bool
    {
        $applicationsCount ??= $this->applicationsCount();

        return $applicationsCount >= $this->monthly_quota;
    }

    public function registrationStatus(?Carbon $date = null, ?int $applicationsCount = null): string
    {
        $date = ($date ?? now(config('app.timezone')))->copy()->startOfDay();

        if (! $this->is_active) {
            return 'inactive';
        }

        if ($this->start_date && $date->lt($this->start_date->copy()->startOfDay())) {
            return 'before_start';
        }

        if ($this->end_date && $date->gt($this->end_date->copy()->startOfDay())) {
            return 'after_end';
        }

        return $this->isClosed($applicationsCount) ? 'full' : 'open';
    }

    public function canRegister(?Carbon $date = null, ?int $applicationsCount = null): bool
    {
        return $this->registrationStatus($date, $applicationsCount) === 'open';
    }
}
