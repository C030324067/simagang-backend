<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\InternshipPeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InternshipPeriodTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-12 12:00:00');
        Storage::fake('public');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_current_status_reports_quarter_month_quota_and_full_state(): void
    {
        $division = $this->createDivision();
        $period = InternshipPeriod::create([
            'division_id' => $division->id,
            'year' => 2026,
            'quarter' => 4,
            'month' => 10,
            'monthly_quota' => 1,
        ]);
        $this->createTestApplication($division);

        $this->getJson('/api/internship-periods/current-status')
            ->assertOk()
            ->assertJsonPath('data.year', 2026)
            ->assertJsonPath('data.month', 10)
            ->assertJsonPath('data.quarter', 4)
            ->assertJsonPath('data.divisions.0.configured', true)
            ->assertJsonPath('data.divisions.0.monthly_quota', 1)
            ->assertJsonPath('data.divisions.0.registered_count', 1)
            ->assertJsonPath('data.divisions.0.remaining_quota', 0)
            ->assertJsonPath('data.divisions.0.is_closed', true)
            ->assertJsonPath('data.divisions.0.availability_status', 'full')
            ->assertJsonPath('data.divisions.0.can_register', false);

        $this->assertTrue($period->isClosed());
    }

    public function test_current_status_respects_registration_dates_and_active_flag(): void
    {
        $division = $this->createDivision();
        $period = InternshipPeriod::create([
            'division_id' => $division->id,
            'year' => 2026,
            'quarter' => 4,
            'month' => 10,
            'monthly_quota' => 6,
            'start_date' => '2026-10-13',
            'end_date' => '2026-10-31',
            'is_active' => true,
        ]);

        $this->getJson('/api/internship-periods/current-status')
            ->assertOk()
            ->assertJsonPath('data.divisions.0.availability_status', 'before_start')
            ->assertJsonPath('data.divisions.0.can_register', false)
            ->assertJsonPath('data.divisions.0.start_date', '2026-10-13');

        $period->update(['is_active' => false]);

        $this->getJson('/api/internship-periods/current-status')
            ->assertOk()
            ->assertJsonPath('data.divisions.0.availability_status', 'inactive')
            ->assertJsonPath('data.divisions.0.is_active', false)
            ->assertJsonPath('data.divisions.0.can_register', false);
    }

    public function test_monthly_application_count_uses_the_configured_timezone_boundary(): void
    {
        $division = $this->createDivision();
        InternshipPeriod::create([
            'division_id' => $division->id,
            'year' => 2026,
            'quarter' => 4,
            'month' => 10,
            'monthly_quota' => 6,
        ]);
        $application = $this->createTestApplication($division);
        $application->forceFill([
            'created_at' => Carbon::parse('2026-10-31 23:59:59', 'Asia/Makassar'),
        ])->save();

        $this->getJson('/api/internship-periods/current-status')
            ->assertOk()
            ->assertJsonPath('data.divisions.0.registered_count', 1)
            ->assertJsonPath('data.divisions.0.remaining_quota', 5);
    }

    public function test_registration_is_rejected_when_monthly_period_quota_is_full(): void
    {
        $division = $this->createDivision();
        InternshipPeriod::create([
            'division_id' => $division->id,
            'year' => 2026,
            'quarter' => 4,
            'month' => 10,
            'monthly_quota' => 0,
        ]);

        $this->postJson('/api/applications/register', [
            'application_type' => 'mandiri',
            'nama' => 'Pendaftar Baru',
            'email' => 'pendaftar@example.test',
            'nim_nisn' => '1234567890',
            'bidang' => $division->code,
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

    public function test_kepegawaian_can_set_quota_and_other_roles_cannot_manage_periods(): void
    {
        $division = $this->createDivision();
        $admin = User::factory()->create(['role' => 'admin_kepegawaian']);
        $applicant = User::factory()->create(['role' => 'applicant']);
        $payload = [
            'division_id' => $division->id,
            'year' => 2026,
            'quarter' => 4,
            'month' => 10,
            'monthly_quota' => 12,
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-31',
            'is_active' => true,
        ];

        $this->actingAs($applicant, 'sanctum')
            ->putJson('/api/internship-periods', $payload)
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/internship-periods', $payload)
            ->assertOk()
            ->assertJsonPath('data.monthly_quota', 12)
            ->assertJsonPath('data.quarter', 4)
            ->assertJsonPath('data.start_date', '2026-10-01')
            ->assertJsonPath('data.end_date', '2026-10-31')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('internship_periods', [
            'division_id' => $division->id,
            'year' => 2026,
            'month' => 10,
            'monthly_quota' => 12,
        ]);
    }

    private function createDivision(): Division
    {
        return Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 5,
        ]);
    }

    private function createTestApplication(Division $division): InternApplication
    {
        $user = User::factory()->create([
            'role' => 'applicant',
            'division_id' => $division->id,
        ]);

        return InternApplication::create([
            'user_id' => $user->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
            'division_id' => $division->id,
        ]);
    }
}
