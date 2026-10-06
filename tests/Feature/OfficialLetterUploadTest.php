<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OfficialLetterUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_kepegawaian_can_upload_official_letters_as_pdf_jpg_or_png(): void
    {
        Storage::fake('public');
        $kepegawaian = User::factory()->create(['role' => 'admin_kepegawaian']);
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
            'quota' => 5,
        ]);

        foreach ([
            ['pdf', 'application/pdf'],
            ['jpg', 'image/jpeg'],
            ['png', 'image/png'],
        ] as [$extension, $mimeType]) {
            $applicant = User::factory()->create([
                'role' => 'applicant',
                'status_akun' => 'pending',
            ]);
            $application = InternApplication::create([
                'user_id' => $applicant->id,
                'application_type' => 'mandiri',
                'institution_name' => 'Universitas Tabalong',
                'start_date' => '2026-11-01',
                'end_date' => '2027-01-31',
                'division_id' => $division->id,
                'status_kadis' => 'approved',
                'status' => 'approved_by_kadis',
                'final_status' => 'in_review',
            ]);

            $response = $this->actingAs($kepegawaian, 'sanctum')
                ->post("/api/applications/{$application->id}/upload-letter", [
                    'official_letter_number' => "SK/{$extension}/2026/001",
                    'official_letter_file' => UploadedFile::fake()->create("letter.{$extension}", 100, $mimeType),
                ], [
                    'Accept' => 'application/json',
                ]);

            $response->assertOk()
                ->assertJsonPath('success', true)
                ->assertJsonPath('data.status', 'accepted');

            $storedApplication = $application->fresh();
            $this->assertSame("SK/{$extension}/2026/001", $storedApplication->official_letter_number);
            Storage::disk('public')->assertExists($storedApplication->official_letter_path);
        }
    }

    public function test_official_letter_upload_requires_the_correct_file_field(): void
    {
        Storage::fake('public');
        $kepegawaian = User::factory()->create(['role' => 'admin_kepegawaian']);
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
            'quota' => 5,
        ]);
        $applicant = User::factory()->create(['role' => 'applicant']);
        $application = InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
            'division_id' => $division->id,
            'status_kadis' => 'approved',
            'status' => 'approved_by_kadis',
            'final_status' => 'in_review',
        ]);

        $this->actingAs($kepegawaian, 'sanctum')
            ->post("/api/applications/{$application->id}/upload-letter", [
                'official_letter_number' => 'SK/2026/002',
                'official_letter' => UploadedFile::fake()->create('letter.pdf', 100, 'application/pdf'),
            ], [
                'Accept' => 'application/json',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['official_letter_file']);
    }

    public function test_non_kepegawaian_user_cannot_upload_official_letters(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
            'quota' => 5,
        ]);
        $applicant = User::factory()->create(['role' => 'applicant']);
        $application = InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
            'division_id' => $division->id,
            'status_kadis' => 'approved',
            'status' => 'approved_by_kadis',
            'final_status' => 'in_review',
        ]);
        $user = User::factory()->create(['role' => 'intern']);

        $this->actingAs($user, 'sanctum')
            ->post("/api/applications/{$application->id}/upload-letter", [
                'official_letter_number' => 'SK/2026/003',
                'official_letter_file' => UploadedFile::fake()->create('letter.pdf', 100, 'application/pdf'),
            ], [
                'Accept' => 'application/json',
            ])
            ->assertForbidden();
    }
}
