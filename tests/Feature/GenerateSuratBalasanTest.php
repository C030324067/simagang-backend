<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GenerateSuratBalasanTest extends TestCase
{
    use RefreshDatabase;

    public function test_kepegawaian_can_generate_and_store_surat_balasan_pdf(): void
    {
        Storage::fake('public');
        $kepegawaian = User::factory()->create(['role' => 'admin_kepegawaian']);
        $applicant = User::factory()->create(['role' => 'applicant']);
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
            'quota' => 5,
        ]);
        $application = InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'major' => 'Informatika',
            'student_number' => 'NIM-2026-001',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
            'division_id' => $division->id,
        ]);

        $this->actingAs($kepegawaian, 'sanctum')
            ->postJson("/api/applications/{$application->id}/surat-balasan", [
                'official_letter_number' => '800/129/Diskominfo/2026',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Surat balasan berhasil diterbitkan.')
            ->assertJsonPath('pdf_url', "/storage/letters/surat_balasan_{$application->id}.pdf");

        $this->assertSame('800/129/Diskominfo/2026', $application->fresh()->official_letter_number);
        $this->assertSame("letters/surat_balasan_{$application->id}.pdf", $application->fresh()->official_letter_path);
        Storage::disk('public')->assertExists($application->fresh()->official_letter_path);

        $html = view('pdf.surat_balasan', [
            'application' => $application->fresh(['user', 'division']),
            'tanggalPenerbitan' => now()->locale('id'),
        ])->render();
        $this->assertStringContainsString('NIM-2026-001', $html);
    }

    public function test_surat_balasan_requires_a_letter_number(): void
    {
        $kepegawaian = User::factory()->create(['role' => 'admin_kepegawaian']);
        $applicant = User::factory()->create(['role' => 'applicant']);
        $application = InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
        ]);

        $this->actingAs($kepegawaian, 'sanctum')
            ->postJson("/api/applications/{$application->id}/surat-balasan", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['official_letter_number']);
    }

    public function test_surat_balasan_route_requires_kepegawaian_authentication(): void
    {
        $this->postJson('/api/applications/1/surat-balasan', [
            'official_letter_number' => '800/129/Diskominfo/2026',
        ])->assertUnauthorized();
    }
}
