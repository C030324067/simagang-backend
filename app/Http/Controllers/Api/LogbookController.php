<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LogbookController extends Controller
{
    use ApiResponse;

    /**
     * List logbook entries.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeRole = $user->activeRole();
        $query = Logbook::with(['user', 'verifier'])->latest('date');

        if ($user->role === 'kabid' && $activeRole !== 'mentor') {
            return $this->errorResponse('Pilih mode Mentor untuk mengakses data bimbingan.', 403);
        }

        if ($activeRole === 'intern') {
            $query->whereHas('internApplication', fn ($q) => $q->where('user_id', $user->id));
        } elseif ($activeRole === 'mentor') {
            if (! $user->isMentorContext()) {
                return $this->errorResponse('Akun ini tidak memiliki akses pembimbing.', 403);
            }

            $query->whereHas('internApplication', fn ($q) => $q->forMentor((int) $user->id));
        } elseif ($request->filled('user_id')) {
            $query->whereHas('internApplication', fn ($q) => $q->where('user_id', $request->input('user_id')));
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->input('verification_status'));
        }

        $logbooks = $query->paginate($request->input('per_page', 15));

        return $this->successResponse($logbooks, 'Daftar logbook berhasil dimuat');
    }

    /**
     * Submit a daily logbook entry (Intern role).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'activity_description' => ['required', 'string', 'min:10'],
            'category' => ['nullable', 'string', 'max:100'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('logbooks', 'public');
        }

        // The application lifecycle is stored in final_status/status. The
        // internship_status column tracks in_progress/completed, not active.
        $application = $request->user()->internApplications()
            ->where(function ($query) {
                $query->where('final_status', 'accepted')
                    ->orWhereIn('status', ['active', 'accepted', 'approved_kadis', 'approved_by_kadis', 'diterima']);
            })
            ->where('internship_status', '!=', 'completed')
            ->with(['division', 'mentor:id,name,role'])
            ->latest('id')
            ->first();
        if (! $application) {
            return $this->errorResponse('Peserta belum memiliki aplikasi magang aktif.', 422);
        }

        $logbook = Logbook::create([
            'intern_application_id' => $application->id,
            'date' => $validated['date'],
            'activity_description' => $validated['activity_description'],
            'category' => $validated['category'] ?? null,
            'attachment' => $attachmentPath,
            'verification_status' => 'approved',
        ]);

        $logbook->load('user');

        return $this->successResponse($logbook, 'Logbook kegiatan berhasil dicatat otomatis', 201);
    }

    /**
     * Verify logbook entry (Mentor / Admin role).
     */
    public function verify(Request $request, Logbook $logbook): JsonResponse
    {
        $user = $request->user();

        if ($user->isMentorContext()) {
            if (! $user->canMentorApplication($logbook->internApplication)) {
                return $this->errorResponse('Anda tidak berhak memverifikasi logbook peserta lain.', 403);
            }
        } elseif ($user->activeRole() !== 'admin_kepegawaian') {
            return $this->errorResponse('Anda tidak berhak memverifikasi logbook ini.', 403);
        }

        $validated = $request->validate([
            'verification_status' => ['required', Rule::in(['approved', 'rejected'])],
            'mentor_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $logbook->update([
            'verification_status' => $validated['verification_status'],
            'mentor_notes' => $validated['mentor_notes'] ?? null,
            'verified_by' => $user->id,
        ]);

        $logbook->load(['user', 'verifier']);

        return $this->successResponse($logbook, 'Status verifikasi logbook berhasil diperbarui');
    }
}
