<?php

namespace Tests\Feature;

use App\Models\Division;
use Database\Seeders\DivisionSeeder;
use Database\Seeders\MentorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DivisionSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_division_list_contains_the_four_seeded_divisions_and_leaders(): void
    {
        $this->seed([
            DivisionSeeder::class,
            MentorSeeder::class,
        ]);

        $this->assertDatabaseCount('divisions', 4);

        $this->getJson('/api/divisions')
            ->assertOk()
            ->assertJsonFragment([
                'code' => 'ikp',
                'name' => 'Bidang Informasi dan Komunikasi Publik (IKP)',
            ])
            ->assertJsonFragment([
                'code' => 'statistik',
                'name' => 'Bidang Statistik',
            ])
            ->assertJsonFragment([
                'code' => 'aptika',
                'name' => 'Bidang Aplikasi Informatika',
            ])
            ->assertJsonFragment([
                'code' => 'tki',
                'name' => 'Bidang Telekomunikasi dan Keamanan Informasi',
            ])
            ->assertJsonFragment([
                'name' => 'Mahdiani Fauzi, S.Sos',
                'position' => 'Kabid TKI',
            ]);

        $this->assertSame(4, Division::query()->count());
    }
}
