<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApplicationTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_tracking_codes_are_generated_and_each_code_resolves_its_own_letter(): void
    {
        Storage::fake('public');
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
            'quota' => 5,
        ]);
        $firstApplicant = User::factory()->create(['name' => 'Risma']);
        $secondApplicant = User::factory()->create(['name' => 'Fuad']);

        $firstApplication = $this->createAcceptedApplication($firstApplicant, $division, 'letters/risma.pdf');
        $secondApplication = $this->createAcceptedApplication($secondApplicant, $division, 'letters/fuad.pdf');
        Storage::disk('public')->put('letters/risma.pdf', 'letter for Risma');
        Storage::disk('public')->put('letters/fuad.pdf', 'letter for Fuad');

        $this->assertNotEmpty($firstApplication->tracking_code);
        $this->assertNotEmpty($secondApplication->tracking_code);
        $this->assertNotSame($firstApplication->tracking_code, $secondApplication->tracking_code);
        $this->assertMatchesRegularExpression('/^TRK-[A-Z0-9]{12}$/', $firstApplication->tracking_code);
        $this->assertMatchesRegularExpression('/^TRK-[A-Z0-9]{12}$/', $secondApplication->tracking_code);

        $firstTracking = $this->getJson("/api/applications/track/{$firstApplication->tracking_code}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json('data');
        $secondTracking = $this->getJson("/api/applications/track/{$secondApplication->tracking_code}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json('data');

        $this->assertNotSame($firstTracking['acceptance_letter_url'], $secondTracking['acceptance_letter_url']);
        $this->get($firstTracking['acceptance_letter_url'])
            ->assertOk()
            ->assertStreamedContent('letter for Risma');
        $this->get($secondTracking['acceptance_letter_url'])
            ->assertOk()
            ->assertStreamedContent('letter for Fuad');
    }

    private function createAcceptedApplication(User $applicant, Division $division, string $letterPath): InternApplication
    {
        return InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
            'division_id' => $division->id,
            'status' => 'accepted',
            'final_status' => 'accepted',
            'official_letter_path' => $letterPath,
        ]);
    }
}
