<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_intern_can_submit_a_file_using_post_and_mentor_can_see_it(): void
    {
        Storage::fake('local');
        $division = Division::create([
            'name' => 'Bidang IKP',
            'code' => 'ikp',
            'quota' => 5,
        ]);
        $mentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $intern = User::factory()->create([
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $task = Task::create([
            'title' => 'Laporan kegiatan',
            'description' => 'Buat laporan kegiatan mingguan.',
            'assigned_to' => $intern->id,
            'created_by' => $mentor->id,
            'division_id' => $division->id,
            'status' => 'pending',
        ]);
        $submission = UploadedFile::fake()->create('laporan.pdf', 100, 'application/pdf');

        $this->actingAs($intern, 'sanctum')
            ->post("/api/tasks/{$task->id}/status", [
                'status' => 'completed',
                'submission_notes' => 'Laporan sudah selesai.',
                'submission_file' => $submission,
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.submission_notes', 'Laporan sudah selesai.');

        $savedTask = $task->fresh();
        $this->assertSame('laporan.pdf', $savedTask->submission_file_name);
        Storage::disk('local')->assertExists($savedTask->submission_file);

        $this->actingAs($mentor, 'sanctum')
            ->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonPath('data.data.0.id', $task->id)
            ->assertJsonPath('data.data.0.status', 'completed')
            ->assertJsonPath('data.data.0.submission_notes', 'Laporan sudah selesai.')
            ->assertJsonPath('data.data.0.submission_file_name', 'laporan.pdf');
    }

    public function test_intern_submission_defaults_missing_status_to_completed(): void
    {
        Storage::fake('local');
        $division = Division::create([
            'name' => 'Bidang IKP',
            'code' => 'ikp',
            'quota' => 5,
        ]);
        $mentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $intern = User::factory()->create([
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $task = Task::create([
            'title' => 'Laporan kegiatan',
            'assigned_to' => $intern->id,
            'created_by' => $mentor->id,
            'division_id' => $division->id,
            'status' => 'pending',
        ]);

        $this->actingAs($intern, 'sanctum')
            ->post("/api/tasks/{$task->id}/status", [
                'submission_notes' => 'Laporan sudah selesai.',
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_intern_submission_defaults_empty_status_to_completed(): void
    {
        Storage::fake('local');
        $division = Division::create([
            'name' => 'Bidang IKP',
            'code' => 'ikp',
            'quota' => 5,
        ]);
        $mentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $intern = User::factory()->create([
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $task = Task::create([
            'title' => 'Laporan kegiatan',
            'assigned_to' => $intern->id,
            'created_by' => $mentor->id,
            'division_id' => $division->id,
            'status' => 'pending',
        ]);

        $this->actingAs($intern, 'sanctum')
            ->post("/api/tasks/{$task->id}/status", [
                'status' => '',
                'submission_notes' => 'Laporan sudah selesai.',
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_mentor_revision_note_is_saved_and_intern_resubmission_marks_task_as_submitted(): void
    {
        Storage::fake('local');
        $division = Division::create([
            'name' => 'Bidang IKP',
            'code' => 'ikp',
            'quota' => 5,
        ]);
        $mentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $intern = User::factory()->create([
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $task = Task::create([
            'title' => 'Laporan kegiatan',
            'assigned_to' => $intern->id,
            'created_by' => $mentor->id,
            'division_id' => $division->id,
            'status' => 'completed',
            'submission_notes' => 'Pengumpulan awal.',
        ]);

        $this->actingAs($mentor, 'sanctum')
            ->putJson("/api/tasks/{$task->id}/status", [
                'status' => 'revision_needed',
                'catatan_revisi' => 'Lengkapi bagian kesimpulan dan lampirkan sumber data.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'revision_needed')
            ->assertJsonPath('data.catatan_revisi', 'Lengkapi bagian kesimpulan dan lampirkan sumber data.');

        $this->actingAs($mentor, 'sanctum')
            ->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonPath('data.data.0.catatan_revisi', 'Lengkapi bagian kesimpulan dan lampirkan sumber data.');

        $this->actingAs($intern, 'sanctum')
            ->post("/api/tasks/{$task->id}/status", [
                'status' => 'completed',
                'submission_notes' => 'Laporan sudah diperbaiki.',
                'submission_file' => UploadedFile::fake()->create('laporan-revisi.pdf', 100, 'application/pdf'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.catatan_revisi', 'Lengkapi bagian kesimpulan dan lampirkan sumber data.')
            ->assertJsonPath('data.submission_notes', 'Laporan sudah diperbaiki.');

        $this->assertSame('completed', $task->fresh()->status);
    }

    public function test_mentor_must_provide_a_revision_note_when_requesting_revision(): void
    {
        $division = Division::create([
            'name' => 'Bidang IKP',
            'code' => 'ikp',
            'quota' => 5,
        ]);
        $mentor = User::factory()->create([
            'role' => 'mentor',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $intern = User::factory()->create([
            'role' => 'intern',
            'status_akun' => 'approved',
            'division_id' => $division->id,
        ]);
        $task = Task::create([
            'title' => 'Laporan kegiatan',
            'assigned_to' => $intern->id,
            'created_by' => $mentor->id,
            'division_id' => $division->id,
            'status' => 'completed',
        ]);

        $this->actingAs($mentor, 'sanctum')
            ->putJson("/api/tasks/{$task->id}/status", ['status' => 'revision_needed'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['catatan_revisi']);
    }
}
