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
}
