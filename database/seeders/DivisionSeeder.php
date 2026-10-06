<?php

namespace Database\Seeders;

use App\Models\Division;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            [
                'code' => 'ikp',
                'name' => 'Bidang Informasi dan Komunikasi Publik (IKP)',
                'description' => 'Mengelola kehumasan, media massa, pengaduan masyarakat, dan keterbukaan informasi publik.',
            ],
            [
                'code' => 'statistik',
                'name' => 'Bidang Statistik',
                'description' => 'Mengelola pengumpulan, validasi, dan integrasi data statistik sektoral daerah.',
            ],
            [
                'code' => 'aptika',
                'name' => 'Bidang Aplikasi Informatika',
                'description' => 'Mengelola aplikasi, jaringan, dan sistem informasi untuk mendukung layanan digital pemerintahan.',
            ],
            [
                'code' => 'tki',
                'name' => 'Bidang Telekomunikasi dan Keamanan Informasi',
                'description' => 'Mengelola telekomunikasi, infrastruktur jaringan, dan keamanan informasi.',
            ],
        ];

        foreach ($divisions as $attributes) {
            $division = Division::query()
                ->whereRaw('LOWER(code) = ?', [$attributes['code']])
                ->first() ?? new Division;

            $division->fill($attributes)->save();
        }
    }
}
