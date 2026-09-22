<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
        $query = Logbook::with(['user', 'verifier'])->latest('date');

        if ($user->role === 'intern') {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
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
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('logbooks', 'public');
        }

        $logbook = Logbook::create([
            'user_id' => $request->user()->id,
            'date' => $validated['date'],
            'activity_description' => $validated['activity_description'],
            'attachment' => $attachmentPath,
            'verification_status' => 'pending',
        ]);

        $logbook->load('user');

        return $this->successResponse($logbook, 'Logbook kegiatan berhasil disimpan', 201);
    }

    /**
     * Verify logbook entry (Mentor / Admin role).
     */
    public function verify(Request $request, Logbook $logbook): JsonResponse
    {
        $validated = $request->validate([
            'verification_status' => ['required', Rule::in(['approved', 'rejected'])],
            'mentor_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $logbook->update([
            'verification_status' => $validated['verification_status'],
            'mentor_notes' => $validated['mentor_notes'] ?? null,
            'verified_by' => $request->user()->id,
        ]);

        $logbook->load(['user', 'verifier']);

        return $this->successResponse($logbook, 'Status verifikasi logbook berhasil diperbarui');
    }
}

