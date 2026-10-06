<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KabidMentorAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_kabid_can_assign_an_approved_mentor_from_their_division_when_approving(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 5,
        ]);
        $kabid = User::factory()->create([
            'role' => 'kabid',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $mentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $application = $this->createTestApplication($division);

        $this->actingAs($kabid, 'sanctum')
            ->getJson("/api/applications/{$application->id}/mentors")
            ->assertOk()
            ->assertJsonPath('data.0.id', $kabid->id)
            ->assertJsonPath('data.0.role', 'kabid')
            ->assertJsonPath('data.1.id', $mentor->id);

        $this->actingAs($kabid, 'sanctum')
            ->putJson("/api/applications/{$application->id}/status", [
                'status' => 'review_kadis',
                'notes' => 'Penempatan teknis disetujui.',
                'mentor_id' => $mentor->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'pending_kadis')
            ->assertJsonPath('data.mentor_id', $mentor->id)
            ->assertJsonPath('data.mentor.name', $mentor->name);

        $this->assertDatabaseHas('intern_applications', [
            'id' => $application->id,
            'status_kabid' => 'approved',
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_kabid_cannot_approve_without_assigning_a_mentor(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 5,
        ]);
        $kabid = User::factory()->create([
            'role' => 'kabid',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $application = $this->createTestApplication($division);

        $this->actingAs($kabid, 'sanctum')
            ->putJson("/api/applications/{$application->id}/status", [
                'status' => 'review_kadis',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['mentor_id']);

        $this->assertDatabaseHas('intern_applications', [
            'id' => $application->id,
            'status' => 'pending_kabid',
            'mentor_id' => null,
        ]);
    }

    public function test_kabid_cannot_assign_an_unapproved_or_cross_division_account(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 5,
        ]);
        $otherDivision = Division::create([
            'name' => 'Bidang Statistik',
            'code' => 'statistik',
            'quota' => 5,
        ]);
        $kabid = User::factory()->create([
            'role' => 'kabid',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $outsideMentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $otherDivision->id,
        ]);
        $unapprovedMentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'pending',
            'division_id' => $division->id,
        ]);
        $application = $this->createTestApplication($division);

        foreach ([$outsideMentor, $unapprovedMentor] as $mentor) {
            $this->actingAs($kabid, 'sanctum')
                ->putJson("/api/applications/{$application->id}/status", [
                    'status' => 'review_kadis',
                    'mentor_id' => $mentor->id,
                ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['mentor_id']);
        }
    }

    public function test_non_kabid_cannot_fetch_mentor_choices(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 5,
        ]);
        $mentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $application = $this->createTestApplication($division);

        $this->actingAs($mentor, 'sanctum')
            ->getJson("/api/applications/{$application->id}/mentors")
            ->assertForbidden();
    }

    public function test_kabid_cannot_fetch_mentor_choices_for_another_division_application(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 5,
        ]);
        $otherDivision = Division::create([
            'name' => 'Bidang Statistik',
            'code' => 'statistik',
            'quota' => 5,
        ]);
        $otherKabid = User::factory()->create([
            'role' => 'kabid',
            'status_akun' => 'approved',
            'division_id' => $otherDivision->id,
        ]);
        $application = $this->createTestApplication($division);

        $this->actingAs($otherKabid, 'sanctum')
            ->getJson("/api/applications/{$application->id}/mentors")
            ->assertForbidden();
    }

    private function createTestApplication(Division $division): InternApplication
    {
        $applicant = User::factory()->create([
            'role' => 'applicant',
            'status_akun' => 'pending',
            'division_id' => $division->id,
        ]);

        return InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'SMK Tabalong',
            'start_date' => now()->addDays(7)->toDateString(),
            'end_date' => now()->addDays(60)->toDateString(),
            'division_id' => $division->id,
            'status' => 'pending_kabid',
            'final_status' => 'in_review',
        ]);
    }
}
