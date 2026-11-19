<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Announcement;
use App\Models\Division;
use App\Models\Evaluation;
use App\Models\InternApplication;
use App\Models\Logbook;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentorDataIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_and_dual_role_kabid_only_access_their_own_assignments_while_kabid_monitoring_stays_division_wide(): void
    {
        $division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'aptika',
            'quota' => 10,
        ]);
        $mentorA = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $mentorB = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $kabid = User::factory()->create([
            'role' => 'kabid',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);

        $applicationA = $this->createAcceptedApplication($division, $mentorA, 'Peserta A');
        $applicationB = $this->createAcceptedApplication($division, $mentorB, 'Peserta B');
        $applicationKabid = $this->createAcceptedApplication($division, $kabid, 'Peserta Kabid');
        $attendanceA = $this->createAttendance($applicationA);
        $attendanceB = $this->createAttendance($applicationB);
        $attendanceKabid = $this->createAttendance($applicationKabid);
        $logbookA = $this->createLogbook($applicationA);
        $logbookB = $this->createLogbook($applicationB);
        $logbookKabid = $this->createLogbook($applicationKabid);
        $taskA = $this->createTask($applicationA, $mentorA);
        $taskB = $this->createTask($applicationB, $mentorB);
        $taskKabid = $this->createTask($applicationKabid, $kabid);
        $evaluationA = $this->createEvaluation($applicationA, $mentorA);
        $evaluationB = $this->createEvaluation($applicationB, $mentorB);
        $evaluationKabid = $this->createEvaluation($applicationKabid, $kabid);

        $this->asMentor($mentorA)
            ->getJson('/api/applications?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $applicationA->id);

        $this->asMentor($mentorA)->getJson("/api/applications/{$applicationA->id}")->assertOk();
        $this->asMentor($mentorA)->getJson("/api/applications/{$applicationB->id}")->assertNotFound();

        $this->asMentor($mentorA)
            ->getJson('/api/attendances?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $attendanceA->id);
        $this->asMentor($mentorA)
            ->getJson('/api/attendances/pending-approval')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $attendanceA->id);
        $this->asMentor($mentorA)
            ->putJson("/api/attendances/{$attendanceB->id}/review", ['approval_status' => 'approved'])
            ->assertNotFound();
        $this->asMentor($mentorA)->getJson("/api/attendances/{$attendanceB->id}/files/selfie")->assertNotFound();
        $this->asMentor($mentorA)
            ->getJson("/api/attendances/summary?user_id={$applicationB->user_id}")
            ->assertForbidden();
        $this->asMentor($mentorA)
            ->putJson("/api/attendances/{$attendanceA->id}/review", ['approval_status' => 'approved'])
            ->assertOk();

        $this->asMentor($mentorA)
            ->getJson('/api/logbooks?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $logbookA->id);
        $this->asMentor($mentorA)
            ->putJson("/api/logbooks/{$logbookB->id}/verify", ['verification_status' => 'approved'])
            ->assertForbidden();
        $this->asMentor($mentorA)
            ->putJson("/api/logbooks/{$logbookA->id}/verify", ['verification_status' => 'approved'])
            ->assertOk();

        $this->asMentor($mentorA)
            ->getJson('/api/tasks?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $taskA->id);
        $this->asMentor($mentorA)
            ->postJson('/api/tasks', ['assigned_to' => $applicationB->user_id, 'title' => 'Tugas silang'])
            ->assertUnprocessable();
        $this->asMentor($mentorA)
            ->putJson("/api/tasks/{$taskB->id}/status", ['status' => 'pending'])
            ->assertForbidden();

        $this->asMentor($mentorA)
            ->getJson('/api/evaluations?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $evaluationA->id);
        $this->asMentor($mentorA)->getJson("/api/evaluations/{$applicationB->user_id}")->assertForbidden();
        $this->asMentor($mentorA)->getJson("/api/evaluations/metrics/{$applicationB->user_id}")->assertForbidden();
        $this->asMentor($mentorA)
            ->postJson('/api/evaluations', [
                'intern_id' => $applicationB->user_id,
                'score_discipline' => 80,
                'score_quality' => 80,
                'score_initiative' => 80,
                'score_teamwork' => 80,
                'score_softskill' => 80,
            ])
            ->assertForbidden();
        $this->asMentor($mentorA)
            ->postJson("/api/evaluations/{$evaluationB->id}/generate-certificate")
            ->assertForbidden();

        $this->asMentor($kabid)
            ->getJson('/api/applications?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $applicationKabid->id);
        $kabidAttendanceResponse = $this->asMentor($kabid)->getJson('/api/attendances?per_page=100');
        $kabidAttendanceResponse->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $attendanceKabid->id);
        $this->asMentor($kabid)
            ->getJson('/api/logbooks?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $logbookKabid->id);
        $this->asMentor($kabid)
            ->getJson('/api/tasks?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $taskKabid->id);
        $this->asMentor($kabid)
            ->getJson('/api/evaluations?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $evaluationKabid->id);
        $this->asMentor($kabid)
            ->postJson('/api/tasks', ['assigned_to' => $applicationKabid->user_id, 'title' => 'Tugas Kabid'])
            ->assertCreated();
        $this->asMentor($kabid)
            ->postJson('/api/evaluations', [
                'intern_id' => $applicationKabid->user_id,
                'score_discipline' => 80,
                'score_quality' => 80,
                'score_initiative' => 80,
                'score_teamwork' => 80,
                'score_softskill' => 80,
            ])
            ->assertUnprocessable();
        $this->asMentor($kabid)
            ->postJson("/api/evaluations/{$evaluationKabid->id}/generate-certificate")
            ->assertUnprocessable();

        $monitoringResponse = $this->actingAs($kabid, 'sanctum')->getJson('/api/kabid/interns?per_page=100');
        $monitoringResponse->assertOk()->assertJsonCount(3, 'data.data');
        $this->assertTrue(collect($monitoringResponse->json('data.data'))
            ->contains(fn (array $application): bool => (int) $application['mentor']['id'] === (int) $kabid->id));
        $this->assertDatabaseHas('intern_applications', [
            'id' => $applicationB->id,
            'mentor_id' => $mentorB->id,
        ]);
    }

    public function test_mentor_application_list_only_contains_active_assignments_and_excludes_completed_or_ended_internships(): void
    {
        $division = Division::create(['name' => 'Bidang Data', 'code' => 'data', 'quota' => 10]);
        $mentorA = User::factory()->create([
            'role' => 'mentor', 'status_akun' => 'approved', 'division_id' => $division->id,
        ]);
        $mentorB = User::factory()->create([
            'role' => 'mentor', 'status_akun' => 'approved', 'division_id' => $division->id,
        ]);

        $activeA = $this->createAcceptedApplication($division, $mentorA, 'Aktif Mentor A');
        $this->createAcceptedApplication($division, $mentorB, 'Aktif Mentor B');
        $activeAttendance = $this->createAttendance($activeA);
        $activeLogbook = $this->createLogbook($activeA);
        $activeTask = $this->createTask($activeA, $mentorA);
        $completed = $this->createAcceptedApplication($division, $mentorA, 'Sudah Selesai');
        $completed->update(['internship_status' => 'completed']);
        $completedEvaluation = $this->createEvaluation($completed, $mentorA);
        $completedAttendance = $this->createAttendance($completed);
        $completedLogbook = $this->createLogbook($completed);
        $completedTask = $this->createTask($completed, $mentorA);
        $ended = $this->createAcceptedApplication($division, $mentorA, 'Periode Lewat');
        $ended->update(['end_date' => now(config('app.timezone'))->subDay()->toDateString()]);
        $endedEvaluation = $this->createEvaluation($ended, $mentorA);
        $endedAttendance = $this->createAttendance($ended);
        $endedLogbook = $this->createLogbook($ended);
        $endedTask = $this->createTask($ended, $mentorA);

        $this->asMentor($mentorA)
            ->getJson('/api/applications?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $activeA->id);

        $this->asMentor($mentorB)
            ->getJson('/api/applications?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.user.name', 'Aktif Mentor B');

        $this->asMentor($mentorA)
            ->getJson('/api/evaluations?per_page=100')
            ->assertOk()
            ->assertJsonCount(2, 'data.data')
            ->assertJsonFragment(['id' => $completedEvaluation->id])
            ->assertJsonFragment(['id' => $endedEvaluation->id]);

        $this->asMentor($mentorA)
            ->getJson('/api/attendances?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $activeAttendance->id);
        $this->asMentor($mentorA)
            ->getJson('/api/attendances/pending-approval')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeAttendance->id);
        $this->asMentor($mentorA)
            ->getJson('/api/logbooks?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $activeLogbook->id);
        $this->asMentor($mentorA)
            ->getJson('/api/tasks?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $activeTask->id);

        foreach ([$completedAttendance, $endedAttendance] as $hiddenAttendance) {
            $this->assertDatabaseHas('attendances', ['id' => $hiddenAttendance->id]);
        }
        foreach ([$completedLogbook, $endedLogbook] as $hiddenLogbook) {
            $this->assertDatabaseHas('logbooks', ['id' => $hiddenLogbook->id]);
        }
        foreach ([$completedTask, $endedTask] as $hiddenTask) {
            $this->assertDatabaseHas('tasks', ['id' => $hiddenTask->id]);
        }
    }

    public function test_kabid_manages_division_announcements_while_mentors_and_interns_only_read_them(): void
    {
        $division = Division::create(['name' => 'Bidang Informasi', 'code' => 'info', 'quota' => 10]);
        $otherDivision = Division::create(['name' => 'Bidang Lain', 'code' => 'lain', 'quota' => 10]);
        $kabid = User::factory()->create([
            'role' => 'kabid', 'status_akun' => 'approved', 'division_id' => $division->id,
        ]);
        $mentor = User::factory()->create([
            'role' => 'mentor', 'status_akun' => 'approved', 'division_id' => $division->id,
        ]);
        $otherKabid = User::factory()->create([
            'role' => 'kabid', 'status_akun' => 'approved', 'division_id' => $otherDivision->id,
        ]);
        $this->createAcceptedApplication($division, $kabid, 'Intern Bimbingan Kabid');
        $application = $this->createAcceptedApplication($division, $mentor, 'Pembaca Intern');

        $created = $this->actingAs($kabid, 'sanctum')->postJson('/api/announcements', [
            'title' => 'Jadwal Briefing',
            'content' => 'Briefing bidang dilaksanakan hari Senin.',
        ])->assertCreated()->assertJsonPath('data.division_id', $division->id);
        $announcementId = $created->json('data.id');

        $this->asMentor($mentor)
            ->getJson('/api/announcements')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $announcementId);
        $this->actingAs($application->user, 'sanctum')
            ->getJson('/api/announcements')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $announcementId);

        $admin = User::factory()->create([
            'role' => 'admin_kepegawaian', 'status_akun' => 'approved',
        ]);
        $generalAnnouncement = $this->actingAs($admin, 'sanctum')->postJson('/api/announcements', [
            'title' => 'Informasi Dinas', 'content' => 'Pengumuman umum.',
        ])->assertCreated()->assertJsonPath('data.division_id', null);
        $generalAnnouncementId = $generalAnnouncement->json('data.id');

        $this->asMentor($mentor)->getJson('/api/announcements')
            ->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $generalAnnouncementId]);
        $this->asMentor($kabid)->getJson('/api/announcements')
            ->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $announcementId]);
        $this->actingAs($application->user, 'sanctum')->getJson('/api/announcements')
            ->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $generalAnnouncementId]);

        $this->asMentor($mentor)->postJson('/api/announcements', [
            'title' => 'Tidak boleh', 'content' => 'Mentor read-only.',
        ])->assertForbidden();
        $this->asMentor($kabid)->postJson('/api/announcements', [
            'title' => 'Mode mentor', 'content' => 'Kabid sedang dalam mode mentor.',
        ])->assertForbidden();
        $this->asMentor($mentor)->putJson("/api/announcements/{$announcementId}", [
            'title' => 'Ubah', 'content' => 'Tidak boleh.',
        ])->assertForbidden();
        $this->asMentor($mentor)->deleteJson("/api/announcements/{$announcementId}")->assertForbidden();
        $this->actingAs($kabid, 'sanctum')->withHeader('X-Active-Role', 'kabid')->patchJson("/api/announcements/{$announcementId}", [
            'title' => 'Jadwal Briefing Terbaru',
        ])->assertOk()->assertJsonPath('data.title', 'Jadwal Briefing Terbaru');

        $otherAnnouncement = Announcement::query()->create([
            'mentor_id' => $otherKabid->id,
            'division_id' => $otherDivision->id,
            'title' => 'Pengumuman bidang lain',
            'content' => 'Tidak terlihat.',
        ]);
        $this->actingAs($kabid, 'sanctum')->withHeader('X-Active-Role', 'kabid')
            ->getJson('/api/announcements')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonMissing(['id' => $otherAnnouncement->id]);
        $this->actingAs($kabid, 'sanctum')->withHeader('X-Active-Role', 'kabid')->deleteJson("/api/announcements/{$announcementId}")->assertOk();
    }

    private function asMentor(User $user): self
    {
        return $this->actingAs($user, 'sanctum')->withHeader('X-Active-Role', 'mentor');
    }

    private function createAcceptedApplication(Division $division, User $mentor, string $name): InternApplication
    {
        $intern = User::factory()->create([
            'name' => $name,
            'role' => 'intern',
            'status_akun' => 'approved',
            'is_active' => true,
            'division_id' => $division->id,
        ]);

        return InternApplication::create([
            'user_id' => $intern->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'major' => 'Teknik Informatika',
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
            'division_id' => $division->id,
            'mentor_id' => $mentor->id,
            'status' => 'accepted',
            'final_status' => 'accepted',
            'internship_status' => 'in_progress',
        ]);
    }

    private function createAttendance(InternApplication $application): Attendance
    {
        return Attendance::create([
            'intern_application_id' => $application->id,
            'date' => now()->toDateString(),
            'status' => 'present',
            'approval_status' => 'pending_approval',
        ]);
    }

    private function createLogbook(InternApplication $application): Logbook
    {
        return Logbook::create([
            'intern_application_id' => $application->id,
            'date' => now()->toDateString(),
            'activity_description' => 'Menyelesaikan tugas harian.',
            'verification_status' => 'pending',
        ]);
    }

    private function createTask(InternApplication $application, User $mentor): Task
    {
        return Task::create([
            'title' => 'Tugas peserta '.$application->user_id,
            'assigned_to' => $application->user_id,
            'division_id' => $application->division_id,
            'created_by' => $mentor->id,
            'status' => 'pending',
        ]);
    }

    private function createEvaluation(InternApplication $application, User $mentor): Evaluation
    {
        return Evaluation::create([
            'intern_application_id' => $application->id,
            'mentor_id' => $mentor->id,
            'discipline_score' => 80,
            'skill_score' => 80,
            'softskill_score' => 80,
            'final_score' => 80,
            'score_discipline' => 80,
            'score_quality' => 80,
            'score_initiative' => 80,
            'score_teamwork' => 80,
            'score_softskill' => 80,
            'grade_letter' => 'B',
        ]);
    }
}
