<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
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
        'profile_photo_path',
        'nip',
        'position',
        'password',
        'role',
        'status_akun',
        'tanggal_disetujui',
        'is_active',
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

    protected $appends = ['profile_photo_url', 'available_roles'];

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
            'tanggal_disetujui' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path
            ? asset('storage/'.$this->profile_photo_path)
            : null;
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function bidang(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(InternApplication::class, 'user_id');
    }

    public function internApplications(): HasMany
    {
        return $this->applications();
    }

    public function activeApplication(): HasOne
    {
        return $this->hasOne(InternApplication::class, 'user_id')->latestOfMany();
    }

    public function internApplication(): HasOne
    {
        return $this->hasOne(InternApplication::class, 'user_id')
            ->where('final_status', 'accepted')
            ->latestOfMany();
    }

    public function gracePeriodEnd(): ?Carbon
    {
        $endDate = $this->getAttribute('end_date') ?? $this->internApplication?->end_date;

        return $endDate ? Carbon::parse($endDate)->addDays(7)->endOfDay() : null;
    }

    public function isExpired(): bool
    {
        if (! $this->isIntern()) {
            return false;
        }

        if ($this->status_akun === 'expired') {
            return true;
        }

        $gracePeriodEnd = $this->gracePeriodEnd();

        return ! $gracePeriodEnd || now(config('app.timezone'))->greaterThan($gracePeriodEnd);
    }

    public function isInternshipActive(): bool
    {
        $application = $this->internApplication;

        return $application?->end_date !== null
            && $application->end_date->toDateString() >= now(config('app.timezone'))->toDateString();
    }

    public function attendances(): HasMany
    {
        return $this->hasManyThrough(Attendance::class, InternApplication::class, 'user_id', 'intern_application_id');
    }

    public function logbooks(): HasManyThrough
    {
        return $this->hasManyThrough(Logbook::class, InternApplication::class, 'user_id', 'intern_application_id');
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    public function evaluations(): HasManyThrough
    {
        return $this->hasManyThrough(Evaluation::class, InternApplication::class, 'user_id', 'intern_application_id');
    }

    public function certificates(): HasManyThrough
    {
        return $this->hasManyThrough(Certificate::class, InternApplication::class, 'user_id', 'intern_application_id');
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

    /**
     * Get the roles available to this account, including mentor assignments.
     *
     * @return list<string>
     */
    public function getAvailableRolesAttribute(): array
    {
        $roles = array_filter([$this->role], fn (?string $role): bool => filled($role));

        if ($this->role === 'kabid' && InternApplication::query()->where('mentor_id', $this->getKey())->exists()) {
            $roles[] = 'mentor';
        }

        return array_values(array_unique($roles));
    }

    /**
     * Determine whether the user may use the requested application context.
     */
    public function hasRole(string $role): bool
    {
        return in_array($role, $this->available_roles, true);
    }

    /**
     * Return the active role only when it is still assigned to this user.
     */
    public function activeRole(): string
    {
        $activeRole = request()->header('X-Active-Role') ?? session('active_role');

        return is_string($activeRole) && $this->hasRole($activeRole)
            ? $activeRole
            : (string) $this->role;
    }
}
