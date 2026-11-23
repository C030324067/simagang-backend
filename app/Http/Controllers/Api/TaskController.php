<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaskStatusRequest;
use App\Models\InternApplication;
use App\Models\Task;
use App\Models\User;
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
        $role = $user->activeRole();
        $query = Task::with(['assignedUser', 'creator:id,name'])->latest();

        if ($role === 'intern') {
            $query->where('division_id', $user->division_id)
                ->where('assigned_to', $user->id);
        } elseif ($role === 'mentor') {
            abort_unless($user->isMentorContext(), 403, 'Akun ini tidak memiliki akses pembimbing.');
            $query->where(function ($tasks) use ($user): void {
                $tasks->whereHas('assignedUser.applications', fn ($applications) => $applications
                    ->forMentor((int) $user->id)
                    ->activeInternships());

                if ($user->role === 'kabid' && $user->division_id !== null) {
                    $tasks->orWhere(function ($divisionTasks) use ($user): void {
                        $divisionTasks->where('division_id', $user->division_id)
                            ->whereHas('assignedUser.applications', fn ($applications) => $applications
                                ->where('division_id', $user->division_id));
                    });
                }
            });
        } elseif ($role === 'kabid') {
            $query->where('division_id', $user->division_id)
                ->whereHas('assignedUser.applications', fn ($applications) => $applications
                    ->where('division_id', $user->division_id));
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
        $role = $user->activeRole();

        if ($role !== 'mentor' || ! $user->isMentorContext()) {
            return $this->errorResponse('Hanya mentor aktif yang dapat membuat tugas.', 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_file' => ['nullable', 'file', 'max:30720'],
            'assigned_to' => [
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->where('role', 'intern')),
            ],
            // The form submits a date (YYYY-MM-DD), so allow any time today.
            'deadline' => ['nullable', 'date', 'after_or_equal:today'],
        ], [
            'assigned_to.exists' => 'Pilih peserta magang yang valid.',
        ]);

        $application = InternApplication::query()
            ->forMentor((int) $user->id)
            ->where('user_id', $validated['assigned_to'])
            ->latest('id')
            ->first();
        if (! $application) {
            return $this->errorResponse('Peserta magang tidak ditugaskan kepada Anda.', 422);
        }

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
            'division_id' => $application->division_id,
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
    public function updateStatus(TaskStatusRequest $request, Task $task): JsonResponse
    {
        $user = $request->user();
        $role = $user->activeRole();

        if ($role === 'intern'
            && ((int) $task->assigned_to !== (int) $user->id || (int) $task->division_id !== (int) $user->division_id)) {
            return $this->errorResponse('Anda tidak berhak memperbarui tugas ini', 403);
        }

        if ($role === 'mentor'
            && ! $this->mentorCanUpdateTask($user, $task)) {
            return $this->errorResponse('Anda tidak berhak memperbarui tugas ini.', 403);
        }

        if (! in_array($role, ['intern', 'mentor'], true)) {
            return $this->errorResponse('Anda tidak berhak memperbarui tugas ini.', 403);
        }

        $validated = $request->validated();

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

        if ($role === 'mentor' && $validated['status'] === 'revision_needed') {
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
        $role = $user->activeRole();
        $canDownloadTask = match ($role) {
            'intern' => (int) $task->assigned_to === (int) $user->id
                && (int) $task->division_id === (int) $user->division_id,
            'mentor' => $this->mentorCanAccessTask($user, $task)
                || $this->kabidCanAccessTask($user, $task),
            'kabid' => $this->kabidCanAccessTask($user, $task),
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

    private function mentorCanAccessTask(User $mentor, Task $task): bool
    {
        $intern = $task->assignedUser;

        return $mentor->isMentorContext()
            && $intern !== null
            && $task->division_id !== null
            && $intern->applications()
                ->forMentor((int) $mentor->id)
                ->where('division_id', $task->division_id)
                ->exists();
    }

    private function mentorCanUpdateTask(User $mentor, Task $task): bool
    {
        return (int) $task->created_by === (int) $mentor->id
            && $this->mentorCanAccessTask($mentor, $task);
    }

    private function kabidCanAccessTask(User $kabid, Task $task): bool
    {
        $intern = $task->assignedUser;

        return $kabid->role === 'kabid'
            && $kabid->division_id !== null
            && (int) $task->division_id === (int) $kabid->division_id
            && $intern !== null
            && $intern->applications()
                ->where('division_id', $kabid->division_id)
                ->exists();
    }
}
