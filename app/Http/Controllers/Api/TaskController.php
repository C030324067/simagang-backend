<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskController extends Controller
{
    use ApiResponse;

    /**
     * List tasks.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Task::with(['assignedUser', 'creator:id,name'])->latest();

        if ($user->role === 'intern') {
            $query->where('division_id', $user->division_id)
                ->where('assigned_to', $user->id);
        } elseif ($user->role === 'mentor') {
            $query->where('division_id', $user->division_id)
                ->where('created_by', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $tasks = $query->paginate($request->input('per_page', 15));

        return $this->successResponse($tasks, 'Daftar penugasan berhasil dimuat');
    }

    /**
     * Create and assign a new task (Mentor role).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->division_id) {
            return $this->errorResponse('Akun mentor belum terhubung dengan divisi', 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_file' => ['nullable', 'file', 'max:30720'],
            'assigned_to' => [
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->where('role', 'intern')
                    ->where('status_akun', 'approved')
                    ->where('division_id', $user->division_id)),
            ],
            'deadline' => ['nullable', 'date', 'after:now'],
        ], [
            'assigned_to.exists' => 'Peserta magang harus berasal dari divisi mentor.',
        ]);

        $taskFilePath = null;
        $taskFileName = null;
        if ($request->hasFile('task_file')) {
            $taskFile = $request->file('task_file');
            $taskFilePath = $taskFile->store('task_attachments', 'local');
            $taskFileName = mb_substr($taskFile->getClientOriginalName(), 0, 255);
        }

        $task = Task::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'assigned_to' => $validated['assigned_to'],
            'division_id' => $user->division_id,
            'created_by' => $user->id,
            'deadline' => $validated['deadline'] ?? null,
            'status' => 'pending',
            'task_file_path' => $taskFilePath,
            'task_file_name' => $taskFileName,
        ]);

        $task->load(['assignedUser', 'creator']);

        return $this->successResponse($task, 'Tugas berhasil diberikan kepada anak magang', 201);
    }

    /**
     * Update task status & submission (Intern role).
     */
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'intern'
            && ((int) $task->assigned_to !== (int) $user->id || (int) $task->division_id !== (int) $user->division_id)) {
            return $this->errorResponse('Anda tidak berhak memperbarui tugas ini', 403);
        }

        if ($user->role === 'mentor'
            && ((int) $task->created_by !== (int) $user->id || (int) $task->division_id !== (int) $user->division_id)) {
            return $this->errorResponse('Anda tidak berhak memperbarui tugas ini.', 403);
        }

        if ($user->role === 'intern' && blank($request->input('status'))) {
            $request->merge(['status' => 'completed']);
        }

        $statuses = $user->role === 'mentor'
            ? ['pending', 'in_progress', 'revision_needed', 'completed']
            : ['pending', 'in_progress', 'completed'];
        $revisionNoteRules = $user->role === 'mentor' && $request->input('status') === 'revision_needed'
            ? ['required', 'string', 'max:1000']
            : ['nullable', 'string', 'max:1000'];
        $validated = $request->validate([
            'status' => ['required', Rule::in($statuses)],
            'submission_notes' => ['nullable', 'string', 'max:1000'],
            'submission_file' => ['nullable', 'file', 'max:30720'],
            'catatan_revisi' => $revisionNoteRules,
            'revision_file' => ['nullable', 'file', 'max:30720'],
        ]);

        if ($validated['status'] === 'completed'
            && blank($validated['submission_notes'] ?? null)
            && ! $request->hasFile('submission_file')
            && ! $task->submission_file) {
            return $this->errorResponse('Tambahkan catatan atau lampirkan berkas sebelum mengumpulkan tugas.', 422);
        }

        $submissionFilePath = $task->submission_file;
        $submissionFileName = $task->submission_file_name;
        if ($request->hasFile('submission_file')) {
            $submissionFile = $request->file('submission_file');
            $submissionFilePath = $submissionFile->store('task_submissions', 'local');
            $submissionFileName = mb_substr($submissionFile->getClientOriginalName(), 0, 255);
        }

        $taskUpdates = [
            'status' => $validated['status'],
            'submission_notes' => $validated['submission_notes'] ?? $task->submission_notes,
            'submission_file' => $submissionFilePath,
            'submission_file_name' => $submissionFileName,
        ];

        if ($user->role === 'mentor' && $validated['status'] === 'revision_needed') {
            $taskUpdates['catatan_revisi'] = $validated['catatan_revisi'];
            if ($request->hasFile('revision_file')) {
                $revisionFile = $request->file('revision_file');
                $taskUpdates['revision_file_path'] = $revisionFile->store('task_revisions', 'local');
                $taskUpdates['revision_file_name'] = mb_substr($revisionFile->getClientOriginalName(), 0, 255);
            }
        }

        $task->update($taskUpdates);

        $task->load(['assignedUser', 'creator']);

        return $this->successResponse($task, 'Status pengerjaan tugas berhasil diperbarui');
    }

    /** Download a task submission after checking the requesting user's access. */
    public function downloadSubmission(Request $request, Task $task): StreamedResponse|JsonResponse
    {
        return $this->downloadTaskFile($request, $task, 'submission');
    }

    public function downloadAttachment(Request $request, Task $task): StreamedResponse|JsonResponse
    {
        return $this->downloadTaskFile($request, $task, 'attachment');
    }

    public function downloadRevisionFile(Request $request, Task $task): StreamedResponse|JsonResponse
    {
        return $this->downloadTaskFile($request, $task, 'revision');
    }

    private function downloadTaskFile(Request $request, Task $task, string $kind): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        $canDownloadTask = match ($user->role) {
            'intern' => (int) $task->assigned_to === (int) $user->id
                && (int) $task->division_id === (int) $user->division_id,
            'mentor' => (int) $task->created_by === (int) $user->id
                && (int) $task->division_id === (int) $user->division_id,
            default => false,
        };

        if (! $canDownloadTask) {
            return $this->errorResponse('Anda tidak berhak mengunduh berkas tugas ini.', 403);
        }

        [$path, $downloadName] = match ($kind) {
            'attachment' => [$task->task_file_path, $task->task_file_name],
            'revision' => [$task->revision_file_path, $task->revision_file_name],
            default => [$task->submission_file, $task->submission_file_name],
        };
        if (! $path) {
            $description = match ($kind) {
                'attachment' => 'Tugas ini belum memiliki berkas instruksi.',
                'revision' => 'Tugas ini belum memiliki berkas revisi.',
                default => 'Tugas ini belum memiliki berkas pengumpulan.',
            };

            return $this->errorResponse($description, 404);
        }

        $downloadName = $downloadName ?: basename($path);
        $headers = ['Content-Type' => 'application/octet-stream'];

        if (Storage::disk('local')->exists($path)) {
            return Storage::disk('local')->download($path, $downloadName, $headers);
        }

        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->download($path, $downloadName, $headers);
        }

        return $this->errorResponse('Berkas tugas tidak ditemukan.', 404);
    }
}
