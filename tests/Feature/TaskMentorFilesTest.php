<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskMentorFilesTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_upload_task_and_revision_files_and_assigned_intern_can_download_them(): void
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

        $created = $this->actingAs($mentor, 'sanctum')
            ->post('/api/tasks', [
                'assigned_to' => $intern->id,
                'title' => 'Laporan kegiatan',
                'description' => 'Buat laporan kegiatan mingguan.',
                'task_file' => UploadedFile::fake()->create('instruksi.pdf', 100, 'application/pdf'),
            ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.task_file_name', 'instruksi.pdf');

        $task = Task::findOrFail($created->json('data.id'));
        Storage::disk('local')->assertExists($task->task_file_path);

        $this->actingAs($intern, 'sanctum')
            ->get("/api/tasks/{$task->id}/attachment")
            ->assertOk();

        $this->actingAs($mentor, 'sanctum')
            ->post("/api/tasks/{$task->id}/status", [
                '_method' => 'PUT',
                'status' => 'revision_needed',
                'catatan_revisi' => 'Mohon lengkapi bagian kesimpulan.',
                'revision_file' => UploadedFile::fake()->create('contoh-revisi.pdf', 100, 'application/pdf'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.catatan_revisi', 'Mohon lengkapi bagian kesimpulan.')
            ->assertJsonPath('data.revision_file_name', 'contoh-revisi.pdf');

        $task->refresh();
        Storage::disk('local')->assertExists($task->revision_file_path);
        $this->actingAs($intern, 'sanctum')
            ->get("/api/tasks/{$task->id}/revision-file")
            ->assertOk();
    }
}
