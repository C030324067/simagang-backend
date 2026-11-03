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
        $staff = [
            ['name' => 'Eka Rismawina, SP., MP', 'nip' => '198410022011012010', 'email' => 'kabid.ikp@diskominfo.go.id', 'position' => 'Kabid IKP', 'role' => 'kabid', 'division' => 'ikp'],
            ['name' => 'Muhammad Tabrani, S.Si, M.M', 'nip' => '198503202009041002', 'email' => 'kabid.statistik@diskominfo.go.id', 'position' => 'Kabid Statistik', 'role' => 'kabid', 'division' => 'statistik'],
            ['name' => 'M. Zainaini, S.Kom, M.T', 'nip' => '197812302011011003', 'email' => 'kabid.aptika@diskominfo.go.id', 'position' => 'Kabid Aptika', 'role' => 'kabid', 'division' => 'aptika'],
            ['name' => 'Mahdiani Fauzi, S.Sos', 'nip' => '197701121997031005', 'email' => 'kabid.tki@diskominfo.go.id', 'position' => 'Kabid TKI', 'role' => 'kabid', 'division' => 'tki'],
        ];
        $divisions = Division::query()->get()->keyBy('code');
        $defaultPassword = Hash::make('password123');

        foreach ($staff as $employee) {
            $division = $divisions->get($employee['division']);
            if (! $division) {
                throw new \RuntimeException("Divisi {$employee['division']} belum dibuat. Jalankan DivisionSeeder terlebih dahulu.");
            }

            User::query()->updateOrCreate(
                ['email' => $employee['email']],
                [
                    'nip' => $employee['nip'],
                    'name' => $employee['name'],
                    'position' => $employee['position'],
                    'password' => $defaultPassword,
                    'role' => $employee['role'],
                    'status_akun' => 'approved',
                    'is_active' => true,
                    'division_id' => $division->id,
                ],
            );
        }
    }
}
