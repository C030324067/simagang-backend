<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuratBalasan extends Model
{
    protected $table = 'surat_balasan';

    protected $fillable = ['nomor_surat', 'tanggal_terbit', 'file_path'];

    protected function casts(): array
    {
        return ['tanggal_terbit' => 'datetime'];
    }

    public function pendaftaran(): HasMany
    {
        return $this->hasMany(InternApplication::class, 'surat_balasan_id');
    }
}
