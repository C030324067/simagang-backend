<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\InternApplicationHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KabidDashboardTest extends TestCase
{
    use RefreshDatabase;

    private Division $division;

    private Division $otherDivision;

    private User $kabid;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->division = $this->createDivision('Aptika', 'aptika');
        $this->otherDivision = $this->createDivision('Statistik', 'statistik');
        $this->kabid = User::factory()->create([
            'role' => 'kabid',
            'status_akun' => 'approved',
            'is_active' => true,
            'division_id' => $this->division->id,
        ]);
    }

    public function test_me_profile_includes_official_division_relation_and_foreign_key(): void
    {
        $this->actingAs($this->kabid, 'sanctum')
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.division_id', $this->division->id)
            ->assertJsonPath('data.division.id', $this->division->id)
            ->assertJsonPath('data.division.name', 'Aptika')
            ->assertJsonPath('data.division.code', 'aptika');
    }

    public function test_divisions_count_only_accepted_applications_with_active_intern_accounts(): void
    {
        $activeIntern = $this->createUser('intern', $this->division, true);
        $inactiveIntern = $this->createUser('intern', $this->division, false);
        $otherDivisionIntern = $this->createUser('intern', $this->otherDivision, true);

        $this->createTestApplication($activeIntern, $this->division, 'accepted', 'accepted');
        $this->createTestApplication($inactiveIntern, $this->division, 'accepted', 'accepted');
        $this->createTestApplication($otherDivisionIntern, $this->otherDivision, 'accepted', 'accepted');

        $response = $this->getJson('/api/divisions')->assertOk();
        $division = collect($response->json('data'))->firstWhere('id', $this->division->id);

        $this->assertSame(1, $division['active_applications_count']);
    }

    public function test_kabid_intern_list_is_scoped_server_side_and_paginated(): void
    {
        $first = $this->createUser('intern', $this->division, true, 'first-intern@example.test');
        $second = $this->createUser('intern', $this->division, true, 'second-intern@example.test');
        $outside = $this->createUser('intern', $this->otherDivision, true, 'outside-intern@example.test');
        $this->createTestApplication($first, $this->division, 'accepted', 'accepted');
        $this->createTestApplication($second, $this->division, 'accepted', 'accepted');
        $this->createTestApplication($outside, $this->otherDivision, 'accepted', 'accepted');

        $this->actingAs($this->kabid, 'sanctum')
            ->getJson('/api/kabid/interns?division_id='.$this->otherDivision->id.'&per_page=1&page=2')
            ->assertOk()
            ->assertJsonPath('data.current_page', 2)
            ->assertJsonPath('data.per_page', 1)
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.last_page', 2)
            ->assertJsonPath('data.data.0.division_id', $this->division->id)
            ->assertJsonPath('data.data.0.division.name', 'Aptika')
            ->assertJsonPath('data.data.0.user.phone', '08123456789')
            ->assertJsonPath('data.data.0.user.email', 'second-intern@example.test')
            ->assertJsonPath('data.data.0.department', 'Teknik Informatika');
    }

    public function test_kabid_queue_contains_only_pending_kabid_items_in_their_division(): void
    {
        $pendingUser = $this->createUser('applicant', $this->division, false);
        $reviewedUser = $this->createUser('applicant', $this->division, false);
        $outsideUser = $this->createUser('applicant', $this->otherDivision, false);
        $pending = $this->createTestApplication($pendingUser, $this->division, 'pending_kabid', 'in_review');
        $this->createTestApplication($reviewedUser, $this->division, 'review_kabid', 'in_review');
        $this->createTestApplication($outsideUser, $this->otherDivision, 'pending_kabid', 'in_review');

        $this->actingAs($this->kabid, 'sanctum')
            ->getJson('/api/applications/kabid?per_page=1')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.id', $pending->id)
            ->assertJsonPath('data.data.0.notes_kepegawaian', 'Berkas lengkap.')
            ->assertJsonPath('data.data.0.user.name', $pendingUser->name)
            ->assertJsonPath('data.data.0.division.id', $this->division->id)
            ->assertJsonPath('data.data.0.major', 'Teknik Informatika')
            ->assertJsonPath('data.data.0.start_date', now()->addDays(7)->toDateString())
            ->assertJsonPath('data.data.0.cover_letter_path', 'documents/proposal.pdf')
            ->assertJsonPath('data.data.0.file_cv', 'documents/cv.pdf');
    }

    public function test_kabid_cannot_view_another_divisions_application_or_mentor_choices(): void
    {
        $applicant = $this->createUser('applicant', $this->otherDivision, false);
        $application = $this->createTestApplication($applicant, $this->otherDivision, 'pending_kabid', 'in_review');

        $this->actingAs($this->kabid, 'sanctum')
            ->getJson("/api/applications/{$application->id}")
            ->assertForbidden();
        $this->getJson("/api/applications/{$application->id}/mentors")
            ->assertForbidden();
        $this->putJson("/api/applications/{$application->id}/approve-kabid", [
            'status' => 'rejected',
            'notes' => 'Tidak sesuai.',
        ])->assertForbidden();
        $this->putJson("/api/applications/{$application->id}/status", [
            'status' => 'pending_kadis',
        ])->assertForbidden();
    }

    public function test_mentor_list_and_decisions_reject_inactive_or_cross_division_mentors(): void
    {
        $applicant = $this->createUser('applicant', $this->division, false);
        $application = $this->createTestApplication($applicant, $this->division, 'pending_kabid', 'in_review');
        $activeMentor = $this->createUser('mentor', $this->division, true);
        $inactiveMentor = $this->createUser('mentor', $this->division, false);
        $outsideMentor = $this->createUser('mentor', $this->otherDivision, true);

        $this->actingAs($this->kabid, 'sanctum')
            ->getJson("/api/applications/{$application->id}/mentors")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeMentor->id);

        foreach ([$inactiveMentor, $outsideMentor] as $mentor) {
            $this->putJson("/api/applications/{$application->id}/approve-kabid", [
                'status' => 'approved',
                'mentor_id' => $mentor->id,
            ])->assertUnprocessable()->assertJsonValidationErrors(['mentor_id']);
        }
    }

    public function test_approve_and_reject_decisions_persist_timestamps_and_history_consistently(): void
    {
        $applicant = $this->createUser('applicant', $this->division, false);
        $approvedApplication = $this->createTestApplication($applicant, $this->division, 'pending_kabid', 'in_review');
        $mentor = $this->createUser('mentor', $this->division, true);

        $this->actingAs($this->kabid, 'sanctum')
            ->putJson("/api/applications/{$approvedApplication->id}/approve-kabid", [
                'status' => 'approved',
                'notes' => 'Sesuai kebutuhan bidang.',
                'mentor_id' => $mentor->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'pending_kadis')
            ->assertJsonPath('data.mentor_id', $mentor->id)
            ->assertJsonPath('data.histories.0.decision', 'approved')
            ->assertJsonPath('data.histories.0.notes', 'Sesuai kebutuhan bidang.');

        $this->assertDatabaseHas('intern_applications', [
            'id' => $approvedApplication->id,
            'status' => 'pending_kadis',
            'status_kabid' => 'approved',
            'mentor_id' => $mentor->id,
            'verified_by_kabid' => $this->kabid->id,
            'notes_kabid' => 'Sesuai kebutuhan bidang.',
        ]);
        $this->assertNotNull($approvedApplication->fresh()->kabid_decided_at);
        $this->assertDatabaseHas('intern_application_histories', [
            'intern_application_id' => $approvedApplication->id,
            'actor_id' => $this->kabid->id,
            'from_status' => 'pending_kabid',
            'to_status' => 'pending_kadis',
            'decision' => 'approved',
        ]);

        $rejectedApplicant = $this->createUser('applicant', $this->division, false);
        $rejectedApplication = $this->createTestApplication($rejectedApplicant, $this->division, 'pending_kabid', 'in_review');
        $this->putJson("/api/applications/{$rejectedApplication->id}/approve-kabid", [
            'status' => 'rejected',
            'notes' => 'Latar belakang tidak sesuai.',
        ])->assertOk()->assertJsonPath('data.status', 'rejected_by_kabid');

        $this->assertDatabaseHas('intern_applications', [
            'id' => $rejectedApplication->id,
            'status' => 'rejected_by_kabid',
            'final_status' => 'rejected',
            'rejection_stage' => 'kabid',
            'notes_kabid' => 'Latar belakang tidak sesuai.',
        ]);
        $this->assertNotNull($rejectedApplication->fresh()->kabid_rejected_at);
        $this->assertDatabaseHas('intern_application_histories', [
            'intern_application_id' => $rejectedApplication->id,
            'decision' => 'rejected',
            'to_status' => 'rejected_by_kabid',
        ]);
    }

    public function test_kabid_document_access_is_limited_to_their_division(): void
    {
        Storage::disk('public')->put('documents/private.pdf', 'private-content');
        $sameDivisionApplicant = $this->createUser('applicant', $this->division, false);
        $sameDivisionApplication = $this->createTestApplication($sameDivisionApplicant, $this->division, 'pending_kabid', 'in_review');
        $sameDivisionApplication->update(['cover_letter_path' => 'documents/private.pdf']);

        $otherDivisionApplicant = $this->createUser('applicant', $this->otherDivision, false);
        $otherDivisionApplication = $this->createTestApplication($otherDivisionApplicant, $this->otherDivision, 'pending_kabid', 'in_review');
        $otherDivisionApplication->update(['cover_letter_path' => 'documents/private.pdf']);

        $this->actingAs($this->kabid, 'sanctum')
            ->get("/api/applications/{$sameDivisionApplication->id}/documents/proposal")
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $this->get("/api/applications/{$otherDivisionApplication->id}/documents/proposal")
            ->assertForbidden();
        $this->get("/api/applications/{$sameDivisionApplication->id}/documents/missing")
            ->assertNotFound();
    }

    public function test_kabid_application_history_is_division_scoped_and_contains_decision_metadata(): void
    {
        $sameDivisionApplicant = $this->createUser('applicant', $this->division, false);
        $sameDivisionApplication = $this->createTestApplication($sameDivisionApplicant, $this->division, 'rejected_by_kabid', 'rejected');
        $sameDivisionApplication->forceFill([
            'final_status' => 'rejected',
            'status_kabid' => 'rejected',
            'notes_kabid' => 'Catatan keputusan.',
            'verified_by_kabid' => $this->kabid->id,
            'kabid_decided_at' => now(),
            'kabid_rejected_at' => now(),
            'rejection_stage' => 'kabid',
        ])->save();
        InternApplicationHistory::query()->create([
            'intern_application_id' => $sameDivisionApplication->id,
            'actor_id' => $this->kabid->id,
            'actor_role' => 'kabid',
            'from_status' => 'pending_kabid',
            'to_status' => 'rejected_by_kabid',
            'decision' => 'rejected',
            'notes' => 'Catatan keputusan.',
            'decided_at' => now(),
        ]);

        $outsideApplicant = $this->createUser('applicant', $this->otherDivision, false);
        $this->createTestApplication($outsideApplicant, $this->otherDivision, 'pending_kadis', 'in_review');

        $this->actingAs($this->kabid, 'sanctum')
            ->getJson('/api/applications?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.id', $sameDivisionApplication->id)
            ->assertJsonPath('data.data.0.notes_kabid', 'Catatan keputusan.')
            ->assertJsonPath('data.data.0.rejection_stage', 'kabid')
            ->assertJsonPath('data.data.0.histories.0.decision', 'rejected');
    }

    private function createDivision(string $name, string $code): Division
    {
        return Division::create(['name' => $name, 'code' => $code, 'quota' => 10]);
    }

    private function createUser(string $role, Division $division, bool $active, ?string $email = null): User
    {
        return User::factory()->create([
            'name' => ucfirst($role).' Test',
            'email' => $email ?? fake()->unique()->safeEmail(),
            'role' => $role,
            'status_akun' => $active ? 'approved' : 'pending',
            'is_active' => $active,
            'no_hp' => '08123456789',
            'division_id' => $division->id,
        ]);
    }

    private function createTestApplication(
        User $user,
        Division $division,
        string $status,
        string $finalStatus,
    ): InternApplication {
        return InternApplication::create([
            'user_id' => $user->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'major' => 'Teknik Informatika',
            'start_date' => now()->addDays(7)->toDateString(),
            'end_date' => now()->addDays(60)->toDateString(),
            'status' => $status,
            'status_kepegawaian' => 'approved',
            'notes_kepegawaian' => 'Berkas lengkap.',
            'status_kabid' => 'pending',
            'final_status' => $finalStatus,
            'division_id' => $division->id,
            'cover_letter_path' => 'documents/proposal.pdf',
            'file_cv' => 'documents/cv.pdf',
            'transcript_path' => 'documents/transcript.pdf',
            'student_card_path' => 'documents/student-card.pdf',
        ]);
    }
}
