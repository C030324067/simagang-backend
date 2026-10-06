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

        $this->assertDatabaseCount('users', 17);
        $this->assertDatabaseHas('users', [
            'nip' => '198410022011012010',
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
            'nip' => '198805282011012010',
            'name' => 'Resky Riswanidar Safitri, S.Kom',
            'position' => 'Pranata Komputer Ahli Muda',
            'role' => 'mentor',
            'division_id' => $aptikaId,
        ]);
    }

    public function test_seeded_tki_kabid_can_log_in_with_the_official_email(): void
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
}
