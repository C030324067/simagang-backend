<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AcceptanceLetterPdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_kepegawaian_can_download_a_pdf_for_an_accepted_application(): void
    {
        $division = $this->createDivision('ikp');
        $applicant = User::factory()->create([
            'name' => 'Pendaftar Magang',
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $application = $this->createAcceptedApplication($applicant, $division);
        $admin = User::factory()->create(['role' => 'admin_kepegawaian']);

        $response = $this->actingAs($admin, 'sanctum')
            ->get("/pendaftaran/{$application->id}/cetak-surat");

        $response->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertHeader('content-disposition', 'attachment; filename=Surat-Balasan-Pendaftar-Magang.pdf');

        $this->assertStringStartsWith('%PDF-', $response->getContent());
        $this->assertDatabaseHas('intern_applications', [
            'id' => $application->id,
            'acceptance_letter_number' => sprintf('SIMAGANG/%04d/%06d', now()->year, $application->id),
        ]);
    }

    public function test_pdf_uses_the_selected_applicants_data_when_multiple_applications_exist(): void
    {
        $division = $this->createDivision('ikp');
        $firstApplicant = User::factory()->create([
            'name' => 'Pendaftar Pertama',
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $selectedApplicant = User::factory()->create([
            'name' => 'Jaya Ramadhani',
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $firstApplication = $this->createAcceptedApplication($firstApplicant, $division);
        $selectedApplication = $this->createAcceptedApplication($selectedApplicant, $division);
        $firstApplication->update([
            'institution_name' => 'Institusi Pertama',
            'student_number' => '1111111111',
            'major' => 'Jurusan Pertama',
        ]);
        $selectedApplication->update([
            'institution_name' => 'Universitas Jaya',
            'student_number' => '2222222222',
            'major' => 'Teknik Informatika',
        ]);
        $admin = User::factory()->create(['role' => 'admin_kepegawaian']);

        $response = $this->actingAs($admin, 'sanctum')
            ->get("/pendaftaran/{$selectedApplication->id}/cetak-surat");

        $response->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename=Surat-Balasan-jaya-ramadhani.pdf');

        $renderedLetter = view('pdf.surat_penerimaan', [
            'pendaftar' => $selectedApplication->fresh(['user', 'division', 'verifierKadis']),
            'tanggalPenerbitan' => now()->locale('id'),
        ])->render();

        $this->assertStringContainsString('Jaya Ramadhani', $renderedLetter);
        $this->assertStringContainsString('Universitas Jaya', $renderedLetter);
        $this->assertStringContainsString('2222222222', $renderedLetter);
        $this->assertStringNotContainsString('Pendaftar Pertama', $renderedLetter);
        $this->assertStringNotContainsString('1111111111', $renderedLetter);
    }

    public function test_kabid_can_download_only_an_accepted_application_in_their_division(): void
    {
        $ownDivision = $this->createDivision('ikp');
        $otherDivision = $this->createDivision('aptika');
        $kabid = User::factory()->create([
            'role' => 'kabid',
            'division_id' => $ownDivision->id,
        ]);
        $ownApplicant = User::factory()->create([
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $ownDivision->id,
        ]);
        $otherApplicant = User::factory()->create([
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $otherDivision->id,
        ]);
        $ownApplication = $this->createAcceptedApplication($ownApplicant, $ownDivision);
        $otherApplication = $this->createAcceptedApplication($otherApplicant, $otherDivision);

        $this->actingAs($kabid, 'sanctum')
            ->get("/pendaftaran/{$ownApplication->id}/cetak-surat")
            ->assertOk();

        $this->actingAs($kabid, 'sanctum')
            ->get("/pendaftaran/{$otherApplication->id}/cetak-surat")
            ->assertNotFound();
    }

    public function test_unaccepted_applications_do_not_have_a_printable_acceptance_letter(): void
    {
        $division = $this->createDivision('ikp');
        $applicant = User::factory()->create([
            'role' => 'applicant',
            'division_id' => $division->id,
        ]);
        $application = InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'student_number' => '1234567890',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
            'division_id' => $division->id,
            'status' => 'pending_kadis',
            'final_status' => 'in_review',
        ]);
        $admin = User::factory()->create(['role' => 'admin_kepegawaian']);

        $this->actingAs($admin, 'sanctum')
            ->get("/pendaftaran/{$application->id}/cetak-surat")
            ->assertNotFound();
    }

    public function test_registration_saves_the_applicants_nim_or_nisn(): void
    {
        Storage::fake('public');
        $division = $this->createDivision('ikp');

        $this->post('/api/applications/register', [
            'application_type' => 'mandiri',
            'nama' => 'Pendaftar Baru',
            'email' => 'pendaftar@example.test',
            'nim_nisn' => '1234567890',
            'bidang' => $division->code,
            'institusi' => 'Universitas Tabalong',
            'jurusan' => 'Informatika',
            'hp' => '081234567890',
            'tgl_mulai' => '2026-11-01',
            'tgl_selesai' => '2027-01-31',
            'pw' => 'password123',
            'pw2' => 'password123',
            'b1' => UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf'),
            'b2' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
            'b3' => UploadedFile::fake()->create('transcript.pdf', 100, 'application/pdf'),
            'b4' => UploadedFile::fake()->image('student-card.jpg'),
        ])->assertCreated();

        $this->assertDatabaseHas('intern_applications', [
            'student_number' => '1234567890',
            'institution_name' => 'Universitas Tabalong',
        ]);
    }

    private function createDivision(string $code): Division
    {
        return Division::create([
            'name' => strtoupper($code).' Division',
            'code' => $code,
            'quota' => 5,
        ]);
    }

    private function createAcceptedApplication(User $applicant, Division $division): InternApplication
    {
        return InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'major' => 'Informatika',
            'student_number' => '1234567890',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
            'division_id' => $division->id,
            'status' => 'accepted',
            'status_kepegawaian' => 'approved',
            'status_kabid' => 'approved',
            'status_kadis' => 'approved',
            'final_status' => 'accepted',
        ]);
    }
}
