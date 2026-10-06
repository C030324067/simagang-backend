<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'quota',
    ];

    protected function casts(): array
    {
        return [
            'quota' => 'integer',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function activeMentor(): HasOne
    {
        return $this->hasOne(User::class, 'division_id')
            ->where('role', 'mentor')
            ->where('status_akun', 'approved');
    }

    public function activeKabid(): HasOne
    {
        return $this->hasOne(User::class, 'division_id')
            ->where('role', 'kabid')
            ->where('status_akun', 'approved');
    }

    public function activeInterns(): HasMany
    {
        return $this->hasMany(User::class)
            ->where('role', 'intern')
            ->where('status_akun', 'approved');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function remainingQuota(?int $activeApplicationsCount = null): int
    {
        $activeApplicationsCount ??= $this->activeApplications()->count();

        return max(0, (int) $this->quota - $activeApplicationsCount);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(InternApplication::class);
    }

    public function activeApplications(): HasMany
    {
        return $this->applications()
            ->where('final_status', 'accepted')
            ->where('internship_status', 'in_progress');
    }
}
