<?php

namespace Tests\Feature;

use App\Models\Division;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentorSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_idempotent_staff_accounts_with_correct_divisions(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);
        $ikpId = Division::query()->where('code', 'ikp')->value('id');
        $aptikaId = Division::query()->where('code', 'aptika')->value('id');
        $tkiId = Division::query()->where('code', 'tki')->value('id');

        $this->assertDatabaseCount('users', 19);
        $this->assertDatabaseHas('users', [
            'nip' => '198410022011012010',
            'email' => 'kabid.ikp@diskominfo.go.id',
            'name' => 'Eka Rismawina, SP., MP',
            'position' => 'Kabid IKP',
            'role' => 'kabid',
            'division_id' => $ikpId,
        ]);
        $this->assertDatabaseHas('users', [
            'nip' => '197701121997031005',
            'email' => 'kabid.tki@diskominfo.go.id',
            'name' => 'Mahdiani Fauzi, S.Sos',
            'position' => 'Kabid TKI',
            'role' => 'kabid',
            'division_id' => $tkiId,
        ]);
        $this->assertDatabaseHas('users', [
            'nip' => '198802102015052001',
            'email' => 'mentor1.tki@diskominfo.go.id',
            'name' => 'Yuliana Putri, S.Sos',
            'position' => 'Pembimbing TKI Ahli Pertama',
            'role' => 'mentor',
            'division_id' => $tkiId,
        ]);
        $this->assertDatabaseHas('users', [
            'nip' => '198805282011012010',
            'email' => 'mentor1.aptika@diskominfo.go.id',
            'name' => 'Resky Riswanidar Safitri, S.Kom',
            'position' => 'Pranata Komputer Ahli Muda',
            'role' => 'mentor',
            'division_id' => $aptikaId,
        ]);

        foreach ([
            '198410022011012010' => 'kabid.ikp@diskominfo.go.id',
            '196909091993032006' => 'mentor1.ikp@diskominfo.go.id',
            '197801212011012002' => 'mentor2.ikp@diskominfo.go.id',
            '198706192011011011' => 'mentor3.ikp@diskominfo.go.id',
            '199710302025042003' => 'mentor4.ikp@diskominfo.go.id',
            '198503202009041002' => 'kabid.statistik@diskominfo.go.id',
            '200301282024121001' => 'mentor1.statistik@diskominfo.go.id',
            '200110252024122001' => 'mentor2.statistik@diskominfo.go.id',
            '200210162025042001' => 'mentor3.statistik@diskominfo.go.id',
            '197812302011011003' => 'kabid.aptika@diskominfo.go.id',
            '198805282011012010' => 'mentor1.aptika@diskominfo.go.id',
            '199510222020122015' => 'mentor2.aptika@diskominfo.go.id',
            '199801142022031003' => 'mentor3.aptika@diskominfo.go.id',
            '198803032020121020' => 'mentor4.aptika@diskominfo.go.id',
            '199401042025041004' => 'mentor5.aptika@diskominfo.go.id',
            '197701121997031005' => 'kabid.tki@diskominfo.go.id',
            '198802102015052001' => 'mentor1.tki@diskominfo.go.id',
            '199006152020122002' => 'mentor2.tki@diskominfo.go.id',
        ] as $nip => $email) {
            $this->assertDatabaseHas('users', compact('nip', 'email'));
        }
    }

    public function test_seeded_kabid_can_log_in_with_the_role_and_division_email(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->postJson('/api/auth/login', [
            'email' => 'kabid.tki@diskominfo.go.id',
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'kabid.tki@diskominfo.go.id')
            ->assertJsonPath('data.user.role', 'kabid');
    }

    public function test_seeded_tki_mentor_can_log_in_with_mentor_role(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->postJson('/api/auth/login', [
            'email' => 'mentor1.tki@diskominfo.go.id',
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'mentor1.tki@diskominfo.go.id')
            ->assertJsonPath('data.user.role', 'mentor');
    }
}
