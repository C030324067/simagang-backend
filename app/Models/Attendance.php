<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'check_in_time',
        'check_out_time',
        'photo_in',
        'photo_out',
        'status',
        'notes',
        'clock_in_at',
        'clock_out_at',
        'selfie_path',
        'latitude',
        'longitude',
        'is_within_radius',
        'attachment_path',
        'approval_status',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'clock_in_at' => 'datetime',
            'clock_out_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'is_within_radius' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function distanceTo(float $latitude, float $longitude): ?float
    {
        if ($this->latitude === null || $this->longitude === null) {
            return null;
        }

        $earthRadiusMeters = 6_371_000;
        $lat1 = deg2rad((float) $this->latitude);
        $lat2 = deg2rad($latitude);
        $latitudeDelta = deg2rad($latitude - (float) $this->latitude);
        $longitudeDelta = deg2rad($longitude - (float) $this->longitude);
        $haversine = sin($latitudeDelta / 2) ** 2
            + cos($lat1) * cos($lat2) * sin($longitudeDelta / 2) ** 2;
        $haversine = min(1, max(0, $haversine));

        return 2 * $earthRadiusMeters * atan2(sqrt($haversine), sqrt(1 - $haversine));
    }
}
