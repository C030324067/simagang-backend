<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CertificateVerificationTest extends TestCase
{
    use RefreshDatabase;

    private Division $division;

    private User $intern;

    private User $mentor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
        ]);

        $this->intern = User::factory()->create([
            'role' => 'intern',
            'division_id' => $this->division->id,
        ]);

        $this->mentor = User::factory()->create([
            'role' => 'mentor',
            'division_id' => $this->division->id,
        ]);

        InternApplication::create([
            'user_id' => $this->intern->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Indonesia',
            'major' => 'Informatika',
            'jenjang' => 'Kuliah',
            'student_number' => 'NIM123456',
            'start_date' => Carbon::today()->subDays(60)->toDateString(),
            'end_date' => Carbon::today()->toDateString(),
            'final_status' => 'accepted',
            'division_id' => $this->division->id,
            'mentor_id' => $this->mentor->id,
        ]);
    }

    public function test_mentor_evaluates_university_intern_with_technical_scores_and_generates_verifiable_certificate(): void
    {
        $this->actingAs($this->mentor, 'sanctum')->postJson('/api/evaluations', [
            'intern_id' => $this->intern->id,
            'score_discipline' => 90,
            'score_quality' => 85,
            'score_initiative' => 80,
            'score_teamwork' => 85,
            'score_softskill' => 85,
        ])->assertUnprocessable()->assertJsonValidationErrors('technical_scores');

        $evalResponse = $this->actingAs($this->mentor, 'sanctum')->postJson('/api/evaluations', [
            'intern_id' => $this->intern->id,
            'score_discipline' => 90,
            'score_quality' => 85,
            'score_initiative' => 80,
            'score_teamwork' => 85,
            'score_softskill' => 85,
            'technical_scores' => [
                ['criteria' => 'Analisis Sistem', 'score' => 85],
                ['criteria' => 'Dokumentasi Teknis', 'score' => 85],
            ],
            'notes' => 'Kinerja sangat memuaskan.',
        ]);

        $evalResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.final_score', '85.00')
            ->assertJsonPath('data.grade_letter', 'B')
            ->assertJsonPath('data.grade_description', 'BAIK')
            ->assertJsonPath('data.technical_scores.0.criteria', 'Analisis Sistem');

        $evaluationId = $evalResponse->json('data.id');
        $certResponse = $this->actingAs($this->mentor, 'sanctum')
            ->postJson("/api/evaluations/{$evaluationId}/generate-certificate");

        $certResponse->assertStatus(201)
            ->assertJsonPath('success', true);

        $qrHash = $certResponse->json('data.qr_hash');
        $this->assertNotEmpty($qrHash);

        // 3. Public QR Code Verification endpoint (no auth needed)
        $publicVerifyResponse = $this->getJson("/api/public/verify-cert/{$qrHash}");

        $publicVerifyResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.intern.name', $this->intern->name)
            ->assertJsonPath('data.intern.division', 'Bidang Aplikasi Informatika')
            ->assertJsonPath('data.evaluation.final_score', '85.00');
        $publicVerifyResponse->assertJsonPath('data.evaluation.technical_scores.0.criteria', 'Analisis Sistem');

        $pdfResponse = $this->actingAs($this->mentor, 'sanctum')
            ->get('/api/certificates/'.$certResponse->json('data.id').'/download');
        $this->assertPdfHasTwoPages($pdfResponse->assertOk()->getContent());
    }

    public function test_smk_evaluation_averages_technical_and_fixed_skill_scores_and_generates_two_page_pdf(): void
    {
        $smkIntern = User::factory()->create([
            'role' => 'intern',
            'division_id' => $this->division->id,
        ]);
        InternApplication::create([
            'user_id' => $smkIntern->id,
            'application_type' => 'mandiri',
            'institution_name' => 'SMK Negeri 1 Tanjung',
            'major' => 'Rekayasa Perangkat Lunak',
            'jenjang' => 'SMK',
            'student_number' => '1234567890',
            'start_date' => Carbon::today()->subDays(60)->toDateString(),
            'end_date' => Carbon::today()->toDateString(),
            'final_status' => 'accepted',
            'division_id' => $this->division->id,
            'mentor_id' => $this->mentor->id,
        ]);

        $evaluationResponse = $this->actingAs($this->mentor, 'sanctum')->postJson('/api/evaluations', [
            'intern_id' => $smkIntern->id,
            'score_discipline' => 80,
            'score_quality' => 81,
            'score_initiative' => 82,
            'score_teamwork' => 83,
            'score_softskill' => 84,
            'technical_scores' => [
                ['criteria' => 'Pemrograman', 'score' => 100],
                ['criteria' => 'Basis Data', 'score' => 90],
                ['criteria' => 'Jaringan', 'score' => 80],
                ['criteria' => 'Desain Aplikasi', 'score' => 70],
                ['criteria' => 'Pengujian', 'score' => 60],
                ['criteria' => 'Dokumentasi', 'score' => 90],
                ['criteria' => 'Pemecahan Masalah', 'score' => 80],
            ],
        ]);
        $evaluationResponse->assertCreated()
            ->assertJsonPath('data.final_score', '81.67')
            ->assertJsonPath('data.grade_letter', 'B')
            ->assertJsonPath('data.technical_scores.0.criteria', 'Pemrograman');

        $admin = User::factory()->create(['role' => 'admin_kepegawaian']);
        $application = $smkIntern->applications()->firstOrFail();
        $draftPreviewResponse = $this->actingAs($admin, 'sanctum')
            ->get('/api/certificates/'.$application->id.'/preview');
        $this->assertStringStartsWith('%PDF-', $draftPreviewResponse->assertOk()->getContent());
        $this->assertDatabaseMissing('certificates', ['intern_application_id' => $application->id]);

        $numberedPreviewResponse = $this->actingAs($admin, 'sanctum')
            ->get('/api/certificates/'.$application->id.'/preview?certificate_number=800%2F123%2F2026');
        $this->assertStringStartsWith('%PDF-', $numberedPreviewResponse->assertOk()->getContent());
        $this->assertDatabaseMissing('certificates', ['intern_application_id' => $application->id]);

        $certificateResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/certificates/generate', [
            'intern_id' => $smkIntern->id,
            'certificate_number' => 'B-478/Diskominfo/000.3.1/XI/2026',
        ]);
        $certificateResponse->assertCreated()
            ->assertJsonPath('data.certificate_number', 'B-478/Diskominfo/000.3.1/XI/2026');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/certificates/'.$application->id.'/issue')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('certificate_number');

        $updatedCertificateResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/certificates/'.$application->id.'/issue', [
            'certificate_number' => 'B-479/Diskominfo/000.3.1/XI/2026',
        ]);
        $updatedCertificateResponse->assertOk()
            ->assertJsonPath('data.id', $certificateResponse->json('data.id'))
            ->assertJsonPath('data.certificate_number', 'B-479/Diskominfo/000.3.1/XI/2026');

        $pdfResponse = $this->actingAs($admin, 'sanctum')
            ->get('/api/certificates/'.$updatedCertificateResponse->json('data.id').'/download');
        $this->assertPdfHasTwoPages($pdfResponse->assertOk()->getContent());
    }

    public function test_public_verification_returns_404_for_invalid_qr_hash(): void
    {
        $response = $this->getJson('/api/public/verify-cert/invalid-non-existent-hash');

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    private function assertPdfHasTwoPages(string $content): void
    {
        $this->assertStringStartsWith('%PDF-', $content);
        preg_match_all('/\/Type\s*\/Page\b/', $content, $pages);
        $this->assertCount(2, $pages[0]);
    }
}
