<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternApplicationHistory extends Model
{
    protected $fillable = [
        'intern_application_id',
        'actor_id',
        'actor_role',
        'from_status',
        'to_status',
        'decision',
        'notes',
        'decided_at',
    ];

    protected function casts(): array
    {
        return ['decided_at' => 'datetime'];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(InternApplication::class, 'intern_application_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
