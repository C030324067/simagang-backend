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
            ['name' => 'Eka Rismawina, SP., MP', 'nip' => '198410022011012010', 'position' => 'Kabid IKP', 'role' => 'kabid', 'division' => 'ikp'],
            ['name' => 'Hj. Wahidah, S.Sos, M.Si', 'nip' => '196909091993032006', 'position' => 'Pranata Humas Ahli Muda', 'role' => 'mentor', 'division' => 'ikp'],
            ['name' => 'Eva Ariyani, S.S', 'nip' => '197801212011012002', 'position' => 'Pranata Humas Ahli Muda', 'role' => 'mentor', 'division' => 'ikp'],
            ['name' => 'Muhammad Nor Ilhaq, SE', 'nip' => '198706192011011011', 'position' => 'Pranata Humas Ahli Muda', 'role' => 'mentor', 'division' => 'ikp'],
            ['name' => 'Syarifah Nada Fauzana, S.I.Kom', 'nip' => '199710302025042003', 'position' => 'Pranata Humas Ahli Pertama', 'role' => 'mentor', 'division' => 'ikp'],
            ['name' => 'Muhammad Tabrani, S.Si, M.M', 'nip' => '198503202009041002', 'position' => 'Kabid Statistik', 'role' => 'kabid', 'division' => 'statistik'],
            ['name' => 'Aulia Rahman, S.Tr.Stat', 'nip' => '200301282024121001', 'position' => 'Statistisi Ahli Pertama', 'role' => 'mentor', 'division' => 'statistik'],
            ['name' => 'Firdatul Maulaya, S.Tr.Stat', 'nip' => '200110252024122001', 'position' => 'Statistisi Ahli Pertama', 'role' => 'mentor', 'division' => 'statistik'],
            ['name' => 'Noor Fajrina Azkiya, S.Stat', 'nip' => '200210162025042001', 'position' => 'Statistisi Ahli Pertama', 'role' => 'mentor', 'division' => 'statistik'],
            ['name' => 'M. Zainaini, S.Kom, M.T', 'nip' => '197812302011011003', 'position' => 'Kabid Aptika', 'role' => 'kabid', 'division' => 'aptika'],
            ['name' => 'Resky Riswanidar Safitri, S.Kom', 'nip' => '198805282011012010', 'position' => 'Pranata Komputer Ahli Muda', 'role' => 'mentor', 'division' => 'aptika'],
            ['name' => 'Eka Novita Shandra, S.Kom', 'nip' => '199510222020122015', 'position' => 'Pranata Komputer Ahli Pertama', 'role' => 'mentor', 'division' => 'aptika'],
            ['name' => 'Muhammad Ramadhani, S.Kom', 'nip' => '199801142022031003', 'position' => 'Pranata Komputer Ahli Pertama', 'role' => 'mentor', 'division' => 'aptika'],
            ['name' => 'Rahmat Ridhatullah, S.Kom', 'nip' => '198803032020121020', 'position' => 'Pranata Komputer Ahli Pertama', 'role' => 'mentor', 'division' => 'aptika'],
            ['name' => 'Muhammad Riza Rafsanjani, S.Kom', 'nip' => '199401042025041004', 'position' => 'Pranata Komputer Ahli Pertama', 'role' => 'mentor', 'division' => 'aptika'],
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
                ['nip' => $employee['nip']],
                [
                    'name' => $employee['name'],
                    'email' => $employee['email'] ?? $employee['nip'].'@diskominfo.go.id',
                    'position' => $employee['position'],
                    'password' => $defaultPassword,
                    'role' => $employee['role'],
                    'status_akun' => 'approved',
                    'division_id' => $division->id,
                ],
            );
        }
    }
}
