<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenilaianSmk extends Model
{
    protected $table = 'penilaian_smk';

    protected $fillable = ['intern_application_id', 'aspek', 'nilai', 'catatan', 'dinilai_oleh'];

    public function pendaftaran(): BelongsTo
    {
        return $this->belongsTo(InternApplication::class, 'intern_application_id');
    }
}
