<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenilaianKuliah extends Model
{
    protected $table = 'penilaian_kuliah';

    protected $fillable = ['intern_application_id', 'aspek', 'nilai', 'catatan', 'dinilai_oleh'];

    public function pendaftaran(): BelongsTo
    {
        return $this->belongsTo(InternApplication::class, 'intern_application_id');
    }
}
