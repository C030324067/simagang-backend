<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Division;
use App\Models\Holiday;
use App\Models\InternApplication;
use App\Models\User;
use App\Services\EffectiveWorkingDaysCalculator;
use Carbon\Carbon;
use Database\Seeders\HolidaySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AttendanceCalendarTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_weekend_check_in_and_check_out_are_blocked_and_report_day_status(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-10 09:00:00', 'Asia/Makassar'));
        $intern = User::factory()->create(['role' => 'intern']);

        $this->actingAs($intern, 'sanctum')
            ->getJson('/api/attendances/today')
            ->assertOk()
            ->assertJsonPath('attendance_day.is_weekend', true)
            ->assertJsonPath('attendance_day.is_attendance_open', false)
            ->assertJsonPath('attendance_day.message', 'Presensi tidak dibuka pada hari libur akhir pekan.');

        $this->actingAs($intern, 'sanctum')
            ->postJson('/api/attendances/check-in', ['status' => 'leave', 'notes' => 'Izin'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Presensi tidak dibuka pada hari libur akhir pekan.');

        $attendance = Attendance::create([
            'user_id' => $intern->id,
            'date' => Carbon::today()->toDateString(),
            'check_in_time' => '08:00:00',
            'status' => 'present',
        ]);

        $this->actingAs($intern, 'sanctum')
            ->postJson('/api/attendances/check-out')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Presensi tidak dibuka pada hari libur akhir pekan.');

        $this->assertNull($attendance->fresh()->check_out_time);
    }

    public function test_named_holiday_check_in_is_blocked_and_holiday_name_is_returned(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-09 09:00:00', 'Asia/Makassar'));
        Holiday::create(['date' => '2026-10-09', 'name' => 'Hari Libur Daerah']);
        $intern = User::factory()->create(['role' => 'intern']);

        $this->actingAs($intern, 'sanctum')
            ->getJson('/api/attendances/today')
            ->assertOk()
            ->assertJsonPath('attendance_day.is_weekend', false)
            ->assertJsonPath('attendance_day.is_holiday', true)
            ->assertJsonPath('attendance_day.is_attendance_open', false)
            ->assertJsonPath('attendance_day.holiday_name', 'Hari Libur Daerah');

        $this->actingAs($intern, 'sanctum')
            ->postJson('/api/attendances/check-in', ['status' => 'leave', 'notes' => 'Izin'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Presensi tidak dibuka pada hari libur: Hari Libur Daerah.');

        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_holiday_seeder_saves_configured_holidays(): void
    {
        config([
            'attendance.holidays' => [
                ['date' => '2026-12-25', 'name' => 'Hari Natal'],
            ],
        ]);

        $this->seed(HolidaySeeder::class);

        $this->assertDatabaseHas('holidays', [
            'date' => '2026-12-25',
            'name' => 'Hari Natal',
        ]);
    }

    public function test_summary_excludes_weekends_and_database_holidays_from_working_days(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-12 12:00:00', 'Asia/Makassar'));
        Cache::flush();
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 5,
        ]);
        $intern = User::factory()->create([
            'role' => 'intern',
            'division_id' => $division->id,
        ]);
        $application = InternApplication::create([
            'user_id' => $intern->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'start_date' => '2026-10-08',
            'end_date' => '2026-10-12',
            'division_id' => $division->id,
            'status' => 'accepted',
            'final_status' => 'accepted',
        ]);
        Holiday::create(['date' => '2026-10-09', 'name' => 'Hari Libur Daerah']);

        foreach (['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-12'] as $date) {
            Attendance::create([
                'user_id' => $intern->id,
                'date' => $date,
                'status' => 'present',
                'approval_status' => 'approved',
            ]);
        }

        $response = $this->actingAs($intern, 'sanctum')
            ->getJson('/api/attendances/summary')
            ->assertOk();

        $this->assertSame(2, $response->json('data.total_hari_kerja_efektif'), json_encode($response->json()));
        $this->assertSame(2, $response->json('data.total_hadir'), json_encode($response->json()));
        $this->assertSame(100, $response->json('data.attendance_percentage'), json_encode($response->json()));

        $this->assertSame(2, $response->json('data.total_hari_kerja_efektif'));
        $this->assertSame(
            ['2026-10-08', '2026-10-12'],
            app(EffectiveWorkingDaysCalculator::class)->getEffectiveWorkingDates($application->start_date, $application->end_date),
        );
    }
}
