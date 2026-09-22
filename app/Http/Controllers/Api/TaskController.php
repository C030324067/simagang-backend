<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    use ApiResponse;

    /**
     * List tasks.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Task::with(['assignedUser', 'creator'])->latest();

        if ($user->role === 'intern') {
            $query->where('assigned_to', $user->id);
        } elseif ($user->role === 'mentor') {
            $query->where('created_by', $user->id);
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
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['required', 'exists:users,id'],
            'deadline' => ['nullable', 'date', 'after:now'],
        ]);

        $task = Task::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'assigned_to' => $validated['assigned_to'],
            'created_by' => $request->user()->id,
            'deadline' => $validated['deadline'] ?? null,
            'status' => 'todo',
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

        // Intern can only update their own assigned task
        if ($user->role === 'intern' && $task->assigned_to !== $user->id) {
            return $this->errorResponse('Anda tidak berhak memperbarui tugas ini', 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['todo', 'in_progress', 'completed'])],
            'submission_notes' => ['nullable', 'string', 'max:1000'],
            'submission_file' => ['nullable', 'file', 'max:15360'],
        ]);

        $submissionFilePath = $task->submission_file;
        if ($request->hasFile('submission_file')) {
            $submissionFilePath = $request->file('submission_file')->store('task_submissions', 'public');
        }

        $task->update([
            'status' => $validated['status'],
            'submission_notes' => $validated['submission_notes'] ?? $task->submission_notes,
            'submission_file' => $submissionFilePath,
        ]);

        $task->load(['assignedUser', 'creator']);

        return $this->successResponse($task, 'Status pengerjaan tugas berhasil diperbarui');
    }
}

