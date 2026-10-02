<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPassword = Hash::make('password123');

        // 1. Kadis
        User::updateOrCreate(
            ['email' => 'kadis@diskominfo.go.id'],
            [
                'name' => 'Eddy Suriyani, S.Sos., MA',
                'role' => 'kadis',
                'status_akun' => 'approved',
                'password' => $defaultPassword,
            ]
        );

        // 2. Kepala Bidang (Kabid) per Bidang
        $kabidList = [
            [
                'name' => 'Muhammad Zainaini, S.Kom., M.T.',
                'email' => 'kabid.aptika@diskominfo.go.id',
                'division_name' => 'Aptika',
            ],
            [
                'name' => 'Muhammad Tabrani, S.Si., M.M',
                'email' => 'kabid.statistik@diskominfo.go.id',
                'division_name' => 'Statistik dan Persandian',
            ],
            [
                'name' => 'Eka Rismawina, S.P., M.P.',
                'email' => 'kabid.ikp@diskominfo.go.id',
                'division_name' => 'IKP',
            ],
        ];

        foreach ($kabidList as $kabid) {
            $division = Division::where('name', 'LIKE', "%{$kabid['division_name']}%")->first();

            User::updateOrCreate(
                ['email' => $kabid['email']],
                [
                    'name' => $kabid['name'],
                    'role' => 'kabid',
                    'status_akun' => 'approved',
                    'password' => $defaultPassword,
                    'division_id' => $division?->id,
                ]
            );
        }

        // 3. Pembimbing Lapangan (Mentor) per Bidang
        $mentorList = [
            [
                'name' => 'Rian Pratama, S.Kom (Pembimbing Lapangan Aptika)',
                'email' => 'mentor.aptika@diskominfo.go.id', // Bisa diganti 'mentor@diskominfo.go.id' jika ingin menggunakan email lama (ID 5)
                'division_name' => 'Aptika',
            ],
            [
                'name' => 'Hendra Wijaya, S.ST (Pembimbing Lapangan Statistik)',
                'email' => 'mentor.statistik@diskominfo.go.id',
                'division_name' => 'Statistik dan Persandian',
            ],
            [
                'name' => 'Maya Anggraini, S.I.Kom (Pembimbing Lapangan IKP)',
                'email' => 'mentor.ikp@diskominfo.go.id',
                'division_name' => 'IKP',
            ],
        ];

        foreach ($mentorList as $mentor) {
            $division = Division::where('name', 'LIKE', "%{$mentor['division_name']}%")->first();

            User::updateOrCreate(
                ['email' => $mentor['email']],
                [
                    'name' => $mentor['name'],
                    'role' => 'mentor',
                    'status_akun' => 'approved',
                    'password' => $defaultPassword,
                    'division_id' => $division?->id,
                ]
            );
        }
    }
}
