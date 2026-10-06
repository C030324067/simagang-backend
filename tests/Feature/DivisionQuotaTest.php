<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Database\Seeders\DivisionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DivisionQuotaTest extends TestCase
{
    use RefreshDatabase;

    public function test_division_quota_counts_only_accepted_internships_that_are_still_active(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 3,
        ]);

        $activeApplication = $this->createTestApplication($division, 'accepted', 'in_progress');
        $this->createTestApplication($division, 'accepted', 'completed');
        $this->createTestApplication($division, 'in_review', 'in_progress');
        User::factory()->create([
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);

        $this->getJson('/api/divisions')
            ->assertOk()
            ->assertJsonPath('data.0.remaining_quota', 2);

        $activeApplication->update(['internship_status' => 'completed']);

        $this->getJson('/api/divisions')
            ->assertOk()
            ->assertJsonPath('data.0.remaining_quota', 3);
    }

    public function test_registration_is_rejected_when_the_selected_division_has_no_remaining_quota(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 1,
        ]);
        $this->createTestApplication($division, 'accepted', 'in_progress');

        $this->postJson('/api/applications/register', [
            'application_type' => 'mandiri',
            'nama' => 'Pendaftar Baru',
            'email' => 'pendaftar@example.test',
            'bidang' => 'Aptika',
            'institusi' => 'SMK Tabalong',
            'jurusan' => 'Rekayasa Perangkat Lunak',
            'hp' => '081234567890',
            'tgl_mulai' => now()->addDays(7)->toDateString(),
            'tgl_selesai' => now()->addDays(60)->toDateString(),
            'pw' => 'password123',
            'pw2' => 'password123',
            'b1' => UploadedFile::fake()->create('surat.pdf', 100, 'application/pdf'),
            'b2' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
            'b3' => UploadedFile::fake()->create('transkrip.pdf', 100, 'application/pdf'),
            'b4' => UploadedFile::fake()->image('kartu.png'),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['bidang']);

        $this->assertDatabaseMissing('users', ['email' => 'pendaftar@example.test']);
    }

    public function test_registration_accepts_the_tki_division_code_and_persists_its_assignment(): void
    {
        $this->seed(DivisionSeeder::class);
        Storage::fake('public');

        $division = Division::query()->where('code', 'tki')->firstOrFail();
        $response = $this->postJson('/api/applications/register', [
            'application_type' => 'mandiri',
            'nama' => 'Pendaftar TKI',
            'email' => 'pendaftar-tki@example.test',
            'bidang' => 'tki',
            'institusi' => 'Universitas Tabalong',
            'jurusan' => 'Teknik Informatika',
            'hp' => '081234567890',
            'tgl_mulai' => now()->addDays(7)->toDateString(),
            'tgl_selesai' => now()->addDays(60)->toDateString(),
            'pw' => 'password123',
            'pw2' => 'password123',
            'b1' => UploadedFile::fake()->create('surat.pdf', 100, 'application/pdf'),
            'b2' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
            'b3' => UploadedFile::fake()->create('transkrip.pdf', 100, 'application/pdf'),
            'b4' => UploadedFile::fake()->image('kartu.png'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('users', [
            'email' => 'pendaftar-tki@example.test',
            'division_id' => $division->id,
        ]);
        $this->assertDatabaseHas('intern_applications', [
            'division_id' => $division->id,
        ]);
    }

    private function createTestApplication(Division $division, string $finalStatus, string $internshipStatus): InternApplication
    {
        $user = User::factory()->create([
            'role' => $finalStatus === 'accepted' ? 'intern' : 'applicant',
            'status_akun' => $finalStatus === 'accepted' ? 'approved' : 'pending',
            'division_id' => $division->id,
        ]);

        return InternApplication::create([
            'user_id' => $user->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'start_date' => now()->addDays(7)->toDateString(),
            'end_date' => now()->addDays(60)->toDateString(),
            'division_id' => $division->id,
            'final_status' => $finalStatus,
            'internship_status' => $internshipStatus,
        ]);
    }
}
