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
                'code' => 'aptika',
                'name' => 'Bidang Aplikasi Informatika',
                'description' => 'Bidang Aplikasi Informatika.',
            ],
            [
                'code' => 'ikp',
                'name' => 'Bidang Informasi dan Komunikasi Publik',
                'description' => 'Bidang Informasi dan Komunikasi Publik.',
            ],
            [
                'code' => 'statistik',
                'name' => 'Bidang Statistik dan Persandian',
                'description' => 'Bidang Statistik dan Persandian.',
            ],
            [
                'code' => 'tki',
                'name' => 'Bidang Telekomunikasi dan Keamanan Informasi',
                'description' => 'Mengelola telekomunikasi, infrastruktur jaringan, dan keamanan informasi.',
            ],
        ];

        foreach ($divisions as $attributes) {
            Division::query()->firstOrCreate(
                ['code' => $attributes['code']],
                $attributes,
            );
        }
    }
}
