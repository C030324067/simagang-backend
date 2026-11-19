<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Evaluation;
use App\Models\InternApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExecutiveReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_kadis_receives_filtered_executive_report_statistics_and_participants(): void
    {
        $division = $this->createDivision('Aptika', 10);
        $otherDivision = $this->createDivision('Statistik', 5);
        $startDate = now()->subDays(30)->toDateString();
        $endDate = now()->addDays(30)->toDateString();

        $active = $this->createReportApplication($division, 'accepted', 'in_progress', $startDate, $endDate);
        $completed = $this->createReportApplication($division, 'accepted', 'completed', $startDate, $endDate);
        $this->createReportApplication($division, 'rejected', 'in_progress', $startDate, $endDate);
        $expired = $this->createReportApplication($division, 'accepted', 'in_progress', $startDate, $endDate);
        User::query()->findOrFail($expired->user_id)->update(['status_akun' => 'expired']);
        $this->createReportApplication($otherDivision, 'accepted', 'in_progress', $startDate, $endDate);
        $this->createEvaluation($active, 90, 80);
        $this->createEvaluation($completed, 80, 100);

        $kadis = User::factory()->create(['role' => 'kadis']);
        $this->actingAs($kadis, 'sanctum')
            ->getJson('/api/kadis/executive-report?division_id='.$division->id.'&start_date='.$startDate.'&end_date='.$endDate)
            ->assertOk()
            ->assertJsonPath('data.summary.total_applicants', 4)
            ->assertJsonPath('data.summary.total_accepted', 3)
            ->assertJsonPath('data.summary.total_active', 1)
            ->assertJsonPath('data.summary.total_completed', 1)
            ->assertJsonPath('data.summary.average_attendance_percentage', 90)
            ->assertJsonPath('data.divisions.0.division_name', 'Aptika')
            ->assertJsonPath('data.divisions.0.quota', 10)
            ->assertJsonPath('data.divisions.0.total_applicants', 4)
            ->assertJsonPath('data.divisions.0.total_active', 1)
            ->assertJsonPath('data.divisions.0.total_completed', 1)
            ->assertJsonPath('data.divisions.0.average_final_score', 85)
            ->assertJsonPath('data.participants.0.participant_name', 'Peserta '.$active->id)
            ->assertJsonPath('data.participants.0.participant_status', 'active')
            ->assertJsonPath('data.participants.0.institution_name', 'Universitas Tabalong')
            ->assertJsonPath('data.participants.0.attendance_percentage', '80.00')
            ->assertJsonPath('data.participants.1.participant_status', 'completed')
            ->assertJsonPath('data.participants.3.application_id', $expired->id)
            ->assertJsonPath('data.participants.3.participant_status', 'expired');
    }

    public function test_executive_report_is_restricted_to_kadis_and_validates_date_range(): void
    {
        $this->getJson('/api/kadis/executive-report')->assertUnauthorized();

        $mentor = User::factory()->create(['role' => 'mentor']);
        $this->actingAs($mentor, 'sanctum')
            ->getJson('/api/kadis/executive-report')
            ->assertForbidden();

        $kadis = User::factory()->create(['role' => 'kadis']);
        $this->actingAs($kadis, 'sanctum')
            ->getJson('/api/kadis/executive-report?start_date=2026-12-10&end_date=2026-12-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('end_date');
    }

    public function test_kadis_can_export_filtered_executive_report_as_pdf(): void
    {
        $division = $this->createDivision('Aptika', 10);
        $kadis = User::factory()->create(['role' => 'kadis']);

        $this->actingAs($kadis, 'sanctum')
            ->get('/api/kadis/executive-report/export-pdf?division_id='.$division->id)
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertHeader('content-disposition', 'attachment; filename=laporan-eksekutif-magang-'.now()->format('Ymd').'.pdf');

        $this->actingAs($kadis, 'sanctum')
            ->get('/api/kadis/executive-report/export-pdf?start_date=2026-01-01&end_date=2026-03-31')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    private function createDivision(string $name, int $quota): Division
    {
        return Division::create([
            'name' => $name,
            'code' => strtolower($name),
            'quota' => $quota,
        ]);
    }

    private function createReportApplication(
        Division $division,
        string $finalStatus,
        string $internshipStatus,
        string $startDate,
        string $endDate,
    ): InternApplication {
        $user = User::factory()->create([
            'name' => 'Peserta Baru',
            'role' => 'intern',
        ]);

        $application = InternApplication::create([
            'user_id' => $user->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'major' => 'Teknik Informatika',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'division_id' => $division->id,
            'final_status' => $finalStatus,
            'internship_status' => $internshipStatus,
        ]);
        $user->update(['name' => 'Peserta '.$application->id]);

        return $application;
    }

    private function createEvaluation(InternApplication $application, float $score, float $attendance): void
    {
        $mentor = User::factory()->create(['role' => 'mentor']);

        Evaluation::create([
            'intern_application_id' => $application->id,
            'mentor_id' => $mentor->id,
            'final_score' => $score,
            'attendance_percentage' => $attendance,
            'grade_letter' => 'A',
        ]);
    }
}
