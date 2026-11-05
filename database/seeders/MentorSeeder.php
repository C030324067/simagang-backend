<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MentorSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['name' => 'Kabid APTIKA', 'email' => 'kabid.aptika@diskominfo.go.id', 'role' => 'kabid', 'division' => 'aptika'],
            ['name' => 'Kabid IKP', 'email' => 'kabid.ikp@diskominfo.go.id', 'role' => 'kabid', 'division' => 'ikp'],
            ['name' => 'Kabid Statistik', 'email' => 'kabid.statistik@diskominfo.go.id', 'role' => 'kabid', 'division' => 'statistik'],
            ['name' => 'Kabid TKI', 'email' => 'kabid.tki@diskominfo.go.id', 'role' => 'kabid', 'division' => 'tki'],
            ['name' => 'Mentor APTIKA', 'email' => 'mentor.aptika@diskominfo.go.id', 'role' => 'mentor', 'division' => 'aptika'],
            ['name' => 'Mentor IKP', 'email' => 'mentor.ikp@diskominfo.go.id', 'role' => 'mentor', 'division' => 'ikp'],
            ['name' => 'Mentor Statistik', 'email' => 'mentor.statistik@diskominfo.go.id', 'role' => 'mentor', 'division' => 'statistik'],
            ['name' => 'Mentor TKI', 'email' => 'mentor.tki@diskominfo.go.id', 'role' => 'mentor', 'division' => 'tki'],
        ];

        $password = Hash::make('password123');

        foreach ($accounts as $account) {
            $divisionId = Division::query()
                ->where('code', $account['division'])
                ->value('id');

            User::query()->firstOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'role' => $account['role'],
                    'division_id' => $divisionId,
                    'status_akun' => 'approved',
                    'is_active' => true,
                    'password' => $password,
                ],
            );
        }
    }
}
