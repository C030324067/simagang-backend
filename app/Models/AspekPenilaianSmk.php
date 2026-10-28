<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AspekPenilaianSmk extends Model
{
    protected $table = 'aspek_penilaian_smk';

    protected $fillable = ['nama', 'deskripsi', 'urutan', 'aktif', 'dibuat_oleh'];

    protected function casts(): array
    {
        return ['aktif' => 'boolean'];
    }
}
