<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApplicationApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Division $division;
    private User $intern;
    private User $kepegawaian;
    private User $kabid;
    private User $kadis;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
        ]);

        $this->intern = User::factory()->create(['role' => 'intern']);
        $this->kepegawaian = User::factory()->create(['role' => 'admin_kepegawaian']);
        $this->kabid = User::factory()->create([
            'role' => 'kabid',
            'division_id' => $this->division->id,
        ]);
        $this->kadis = User::factory()->create(['role' => 'kadis']);
    }

    public function test_intern_can_submit_mandiri_application(): void
    {
        $fileCv = UploadedFile::fake()->create('cv.pdf', 500, 'application/pdf');
        $fileProposal = UploadedFile::fake()->create('proposal.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($this->intern, 'sanctum')->postJson('/api/applications/submit', [
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Gadjah Mada',
            'start_date' => Carbon::today()->addDays(7)->toDateString(),
            'end_date' => Carbon::today()->addDays(90)->toDateString(),
            'file_cv' => $fileCv,
            'file_proposal' => $fileProposal,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.final_status', 'in_review')
            ->assertJsonPath('data.status_kepegawaian', 'pending');

        $this->assertDatabaseHas('intern_applications', [
            'user_id' => $this->intern->id,
            'application_type' => 'mandiri',
            'status_kepegawaian' => 'pending',
        ]);
    }

    public function test_3_tier_sequential_approval_workflow_to_acceptance(): void
    {
        // 1. Intern has submitted an application
        $application = InternApplication::create([
            'user_id' => $this->intern->id,
            'application_type' => 'rekomendasi_kampus',
            'institution_name' => 'Universitas Indonesia',
            'recommendation_letter_number' => 'REC/2026/001',
            'start_date' => Carbon::today()->addDays(10)->toDateString(),
            'end_date' => Carbon::today()->addDays(100)->toDateString(),
            'status_kepegawaian' => 'pending',
            'status_kabid' => 'pending',
            'status_kadis' => 'pending',
            'final_status' => 'in_review',
        ]);

        // Non-kepegawaian cannot access pending-kepegawaian
        $this->actingAs($this->intern, 'sanctum')
            ->getJson('/api/applications/pending-kepegawaian')
            ->assertStatus(403);

        // Step 2: Admin Kepegawaian verifies & approves, assigning division
        $responseStep2 = $this->actingAs($this->kepegawaian, 'sanctum')
            ->putJson("/api/applications/{$application->id}/approve-kepegawaian", [
                'status' => 'approved',
                'division_id' => $this->division->id,
                'notes' => 'Berkas terverifikasi lengkap.',
            ]);

        $responseStep2->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status_kepegawaian', 'approved')
            ->assertJsonPath('data.division_id', $this->division->id);

        // Step 3: Kabid verifies technical placement & approves
        $responseStep3 = $this->actingAs($this->kabid, 'sanctum')
            ->putJson("/api/applications/{$application->id}/approve-kabid", [
                'status' => 'approved',
                'notes' => 'Penempatan bidang Aptika disetujui.',
            ]);

        $responseStep3->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status_kabid', 'approved');

        // Step 4: Kadis final authorization & acceptance letter generation
        $responseStep4 = $this->actingAs($this->kadis, 'sanctum')
            ->putJson("/api/applications/{$application->id}/approve-kadis", [
                'status' => 'approved',
                'notes' => 'Otorisasi resmi kepala dinas.',
            ]);

        $responseStep4->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status_kadis', 'approved')
            ->assertJsonPath('data.final_status', 'accepted');

        $this->assertNotNull($responseStep4->json('data.acceptance_letter_number'));

        // Check user division is updated
        $this->assertDatabaseHas('users', [
            'id' => $this->intern->id,
            'division_id' => $this->division->id,
        ]);
    }

    public function test_rejection_at_kepegawaian_terminates_workflow(): void
    {
        $application = InternApplication::create([
            'user_id' => $this->intern->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Institut Teknologi Bandung',
            'start_date' => Carbon::today()->addDays(5)->toDateString(),
            'end_date' => Carbon::today()->addDays(60)->toDateString(),
            'status_kepegawaian' => 'pending',
            'final_status' => 'in_review',
        ]);

        $this->actingAs($this->kepegawaian, 'sanctum')
            ->putJson("/api/applications/{$application->id}/approve-kepegawaian", [
                'status' => 'rejected',
                'notes' => 'Kuota magang bidang penuh.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status_kepegawaian', 'rejected')
            ->assertJsonPath('data.final_status', 'rejected');

        $this->assertDatabaseHas('intern_applications', [
            'id' => $application->id,
            'final_status' => 'rejected',
        ]);
    }
}

