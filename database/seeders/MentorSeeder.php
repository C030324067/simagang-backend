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
            ['name' => 'Eka Rismawina, SP., MP', 'role' => 'kabid', 'division' => 'ikp', 'nip' => '198410022011012010', 'position' => 'Kabid IKP'],
            ['name' => 'Hj. Wahidah, S.Sos, M.Si', 'role' => 'mentor', 'division' => 'ikp', 'nip' => '196909091993032006', 'position' => 'Pranata Humas Ahli Muda'],
            ['name' => 'Eva Ariyani, S.S', 'role' => 'mentor', 'division' => 'ikp', 'nip' => '197801212011012002', 'position' => 'Pranata Humas Ahli Muda'],
            ['name' => 'Muhammad Nor Ilhaq, SE', 'role' => 'mentor', 'division' => 'ikp', 'nip' => '198706192011011011', 'position' => 'Pranata Humas Ahli Muda'],
            ['name' => 'Syarifah Nada Fauzana, S.I.Kom', 'role' => 'mentor', 'division' => 'ikp', 'nip' => '199710302025042003', 'position' => 'Pranata Humas Ahli Pertama'],
            ['name' => 'Muhammad Tabrani, S.Si, M.M', 'role' => 'kabid', 'division' => 'statistik', 'nip' => '198503202009041002', 'position' => 'Kabid Statistik'],
            ['name' => 'Aulia Rahman, S.Tr.Stat', 'role' => 'mentor', 'division' => 'statistik', 'nip' => '200301282024121001', 'position' => 'Statistisi Ahli Pertama'],
            ['name' => 'Firdatul Maulaya, S.Tr.Stat', 'role' => 'mentor', 'division' => 'statistik', 'nip' => '200110252024122001', 'position' => 'Statistisi Ahli Pertama'],
            ['name' => 'Noor Fajrina Azkiya, S.Stat', 'role' => 'mentor', 'division' => 'statistik', 'nip' => '200210162025042001', 'position' => 'Statistisi Ahli Pertama'],
            ['name' => 'M. Zainaini, S.Kom, M.T', 'role' => 'kabid', 'division' => 'aptika', 'nip' => '197812302011011003', 'position' => 'Kabid Aptika'],
            ['name' => 'Resky Riswanidar Safitri, S.Kom', 'role' => 'mentor', 'division' => 'aptika', 'nip' => '198805282011012010', 'position' => 'Pranata Komputer Ahli Muda'],
            ['name' => 'Eka Novita Shandra, S.Kom', 'role' => 'mentor', 'division' => 'aptika', 'nip' => '199510222020122015', 'position' => 'Pranata Komputer Ahli Pertama'],
            ['name' => 'Muhammad Ramadhani, S.Kom', 'role' => 'mentor', 'division' => 'aptika', 'nip' => '199801142022031003', 'position' => 'Pranata Komputer Ahli Pertama'],
            ['name' => 'Rahmat Ridhatullah, S.Kom', 'role' => 'mentor', 'division' => 'aptika', 'nip' => '198803032020121020', 'position' => 'Pranata Komputer Ahli Pertama'],
            ['name' => 'Muhammad Riza Rafsanjani, S.Kom', 'role' => 'mentor', 'division' => 'aptika', 'nip' => '199401042025041004', 'position' => 'Pranata Komputer Ahli Pertama'],
            ['name' => 'Mahdiani Fauzi, S.Sos', 'role' => 'kabid', 'division' => 'tki', 'nip' => '197701121997031005', 'position' => 'Kabid TKI'],
            ['name' => 'Yuliana Putri, S.Sos', 'role' => 'mentor', 'division' => 'tki', 'nip' => '198802102015052001', 'position' => 'Pembimbing TKI Ahli Pertama'],
            ['name' => 'Rizki Pratama, S.Kom', 'role' => 'mentor', 'division' => 'tki', 'nip' => '199006152020122002', 'position' => 'Pembimbing TKI Ahli Pertama'],
        ];

        $password = Hash::make('Diskominfo2026!');

        foreach ($accounts as $account) {
            $email = trim($account['nip']).'@diskominfo.go.id';
            $divisionId = Division::query()
                ->where('code', $account['division'])
                ->value('id');

            $user = User::query()->firstOrCreate(
                ['nip' => $account['nip']],
                [
                    'name' => $account['name'],
                    'email' => $email,
                    'role' => $account['role'],
                    'division_id' => $divisionId,
                    'nip' => $account['nip'],
                    'position' => $account['position'],
                    'status_akun' => 'approved',
                    'is_active' => true,
                    'password' => $password,
                ],
            );

            $user->forceFill([
                'name' => $account['name'],
                'email' => $email,
                'role' => $account['role'],
                'division_id' => $divisionId,
                'nip' => $account['nip'],
                'position' => $account['position'],
                'status_akun' => 'approved',
                'is_active' => true,
                'password' => $password,
            ])->save();
        }

        User::query()
            ->whereNotNull('nip')
            ->where('nip', '!=', '')
            ->get()
            ->each(function (User $user): void {
                $user->forceFill([
                    'email' => trim($user->nip).'@diskominfo.go.id',
                ])->save();
            });

        User::query()
            ->whereIn('email', [
                'mentor.aptika@diskominfo.go.id',
                'mentor.ikp@diskominfo.go.id',
                'mentor.statistik@diskominfo.go.id',
                'mentor.tki@diskominfo.go.id',
                'pegawai@diskominfo.go.id',
            ])
            ->where('role', 'mentor')
            ->update(['is_active' => false]);
    }
}
