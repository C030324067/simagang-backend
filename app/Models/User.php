<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'no_hp',
        'division_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(InternApplication::class, 'user_id');
    }

    public function activeApplication(): HasOne
    {
        return $this->hasOne(InternApplication::class, 'user_id')->latestOfMany();
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'user_id');
    }

    public function logbooks(): HasMany
    {
        return $this->hasMany(Logbook::class, 'user_id');
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'intern_id');
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class, 'intern_id');
    }

    public function isIntern(): bool
    {
        return $this->role === 'intern';
    }

    public function isAdminKepegawaian(): bool
    {
        return $this->role === 'admin_kepegawaian';
    }

    public function isKabid(): bool
    {
        return $this->role === 'kabid';
    }

    public function isKadis(): bool
    {
        return $this->role === 'kadis';
    }

    public function isMentor(): bool
    {
        return $this->role === 'mentor';
    }
}
