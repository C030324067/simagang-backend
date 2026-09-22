<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InternApplication;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ApplicationController extends Controller
{
    use ApiResponse;

    /**
     * List all applications with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InternApplication::with(['user', 'division', 'verifierKepegawaian', 'verifierKabid', 'verifierKadis'])
            ->latest();

        if ($request->filled('final_status')) {
            $query->where('final_status', $request->input('final_status'));
        }

        if ($request->filled('division_id')) {
            $query->where('division_id', $request->input('division_id'));
        }

        if ($request->filled('application_type')) {
            $query->where('application_type', $request->input('application_type'));
        }

        $applications = $query->paginate($request->input('per_page', 15));

        return $this->successResponse($applications, 'Daftar pengajuan magang berhasil dimuat');
    }

    /**
     * Get single application details.
     */
    public function show(InternApplication $application): JsonResponse
    {
        $application->load(['user', 'division', 'verifierKepegawaian', 'verifierKabid', 'verifierKadis']);

        return $this->successResponse($application, 'Detail pengajuan magang berhasil dimuat');
    }

    /**
     * Submit a new internship application (Intern role).
     */
    public function submit(Request $request): JsonResponse
    {
        $user = $request->user();

        $rules = [
            'application_type' => ['required', Rule::in(['mandiri', 'rekomendasi_kampus'])],
            'institution_name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'division_id' => ['nullable', 'exists:divisions,id'],
            'file_proposal' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'file_cv' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
            'file_recommendation_letter' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
            'recommendation_letter_number' => ['nullable', 'string', 'max:255'],
        ];

        if ($request->input('application_type') === 'mandiri') {
            $rules['file_cv'] = ['required', 'file', 'mimes:pdf', 'max:5120'];
            $rules['file_proposal'] = ['required', 'file', 'mimes:pdf', 'max:10240'];
        } else {
            $rules['recommendation_letter_number'] = ['required', 'string', 'max:255'];
            $rules['file_recommendation_letter'] = ['required', 'file', 'mimes:pdf', 'max:5120'];
            $rules['file_proposal'] = ['required', 'file', 'mimes:pdf', 'max:10240'];
        }

        $validated = $request->validate($rules);

        $proposalPath = null;
        if ($request->hasFile('file_proposal')) {
            $proposalPath = $request->file('file_proposal')->store('applications/proposals', 'public');
        }

        $cvPath = null;
        if ($request->hasFile('file_cv')) {
            $cvPath = $request->file('file_cv')->store('applications/cvs', 'public');
        }

        $recLetterPath = null;
        if ($request->hasFile('file_recommendation_letter')) {
            $recLetterPath = $request->file('file_recommendation_letter')->store('applications/recommendations', 'public');
        }

        $application = InternApplication::create([
            'user_id' => $user->id,
            'application_type' => $validated['application_type'],
            'institution_name' => $validated['institution_name'],
            'recommendation_letter_number' => $validated['recommendation_letter_number'] ?? null,
            'file_proposal' => $proposalPath,
            'file_cv' => $cvPath,
            'file_recommendation_letter' => $recLetterPath,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'division_id' => $validated['division_id'] ?? null,
            'status_kepegawaian' => 'pending',
            'status_kabid' => 'pending',
            'status_kadis' => 'pending',
            'final_status' => 'in_review',
        ]);

        $application->load(['user', 'division']);

        return $this->successResponse($application, 'Pengajuan magang berhasil dikirim dan masuk ke antrean verifikasi', 201);
    }

    /**
     * Get current user's active internship application.
     */
    public function myApplication(Request $request): JsonResponse
    {
        $application = InternApplication::with(['division', 'verifierKepegawaian', 'verifierKabid', 'verifierKadis'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->first();

        if (! $application) {
            return $this->successResponse(null, 'Belum ada pengajuan magang yang diajukan');
        }

        return $this->successResponse($application, 'Data pengajuan magang Anda');
    }

    /**
     * Tier 1: Admin Kepegawaian pending queue.
     */
    public function pendingKepegawaian(): JsonResponse
    {
        $applications = InternApplication::with(['user', 'division'])
            ->where('status_kepegawaian', 'pending')
            ->where('final_status', 'in_review')
            ->latest()
            ->get();

        return $this->successResponse($applications, 'Daftar pengajuan menunggu verifikasi kepegawaian');
    }

    /**
     * Tier 1: Admin Kepegawaian Approve or Reject.
     */
    public function approveKepegawaian(Request $request, InternApplication $application): JsonResponse
    {
        if ($application->status_kepegawaian !== 'pending') {
            return $this->errorResponse('Pengajuan ini telah diproses oleh kepegawaian sebelumnya', 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'division_id' => ['nullable', 'exists:divisions,id', Rule::requiredIf($request->input('status') === 'approved')],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validated['status'] === 'approved') {
            $application->update([
                'status_kepegawaian' => 'approved',
                'verified_by_kepegawaian' => $request->user()->id,
                'notes_kepegawaian' => $validated['notes'] ?? 'Dokumen lengkap dan terverifikasi oleh Kepegawaian.',
                'division_id' => $validated['division_id'],
            ]);
            $message = 'Pengajuan berhasil disetujui oleh Kepegawaian dan diteruskan ke Kepala Bidang';
        } else {
            $application->update([
                'status_kepegawaian' => 'rejected',
                'verified_by_kepegawaian' => $request->user()->id,
                'notes_kepegawaian' => $validated['notes'] ?? 'Pengajuan ditolak oleh Kepegawaian.',
                'final_status' => 'rejected',
            ]);
            $message = 'Pengajuan ditolak oleh Kepegawaian';
        }

        $application->load(['user', 'division', 'verifierKepegawaian']);

        return $this->successResponse($application, $message);
    }

    /**
     * Tier 2: Kabid pending queue.
     */
    public function pendingKabid(Request $request): JsonResponse
    {
        $query = InternApplication::with(['user', 'division'])
            ->where('status_kepegawaian', 'approved')
            ->where('status_kabid', 'pending')
            ->where('final_status', 'in_review');

        // If Kabid is assigned to a specific division, filter by division
        if ($request->user()->division_id) {
            $query->where('division_id', $request->user()->division_id);
        }

        $applications = $query->latest()->get();

        return $this->successResponse($applications, 'Daftar pengajuan menunggu verifikasi teknis Kepala Bidang');
    }

    /**
     * Tier 2: Kabid Approve or Reject.
     */
    public function approveKabid(Request $request, InternApplication $application): JsonResponse
    {
        if ($application->status_kepegawaian !== 'approved') {
            return $this->errorResponse('Pengajuan harus disetujui oleh kepegawaian terlebih dahulu', 422);
        }

        if ($application->status_kabid !== 'pending') {
            return $this->errorResponse('Pengajuan ini telah diproses oleh Kepala Bidang sebelumnya', 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validated['status'] === 'approved') {
            $application->update([
                'status_kabid' => 'approved',
                'verified_by_kabid' => $request->user()->id,
                'notes_kabid' => $validated['notes'] ?? 'Penempatan teknis bidang telah disetujui.',
            ]);
            $message = 'Pengajuan berhasil disetujui oleh Kabid dan diteruskan ke Kepala Dinas';
        } else {
            $application->update([
                'status_kabid' => 'rejected',
                'verified_by_kabid' => $request->user()->id,
                'notes_kabid' => $validated['notes'] ?? 'Penempatan ditolak oleh Kepala Bidang.',
                'final_status' => 'rejected',
            ]);
            $message = 'Pengajuan ditolak oleh Kepala Bidang';
        }

        $application->load(['user', 'division', 'verifierKabid']);

        return $this->successResponse($application, $message);
    }

    /**
     * Tier 3: Kadis pending queue.
     */
    public function pendingKadis(): JsonResponse
    {
        $applications = InternApplication::with(['user', 'division', 'verifierKepegawaian', 'verifierKabid'])
            ->where('status_kabid', 'approved')
            ->where('status_kadis', 'pending')
            ->where('final_status', 'in_review')
            ->latest()
            ->get();

        return $this->successResponse($applications, 'Daftar pengajuan menunggu otorisasi akhir Kepala Dinas');
    }

    /**
     * Tier 3: Kadis Final Approval / Rejection with Acceptance Letter generation.
     */
    public function approveKadis(Request $request, InternApplication $application): JsonResponse
    {
        if ($application->status_kabid !== 'approved') {
            return $this->errorResponse('Pengajuan harus disetujui oleh Kepala Bidang terlebih dahulu', 422);
        }

        if ($application->status_kadis !== 'pending') {
            return $this->errorResponse('Pengajuan ini telah diproses oleh Kepala Dinas sebelumnya', 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validated['status'] === 'approved') {
            $letterNumber = '500.12.1/DISKOMINFO/'.date('Y').'/'.str_pad((string) $application->id, 4, '0', STR_PAD_LEFT);

            $application->update([
                'status_kadis' => 'approved',
                'verified_by_kadis' => $request->user()->id,
                'notes_kadis' => $validated['notes'] ?? 'Otorisasi surat penerimaan magang resmi disahkan.',
                'final_status' => 'accepted',
                'acceptance_letter_number' => $letterNumber,
            ]);

            // Assign division to user
            $application->user()->update([
                'division_id' => $application->division_id,
            ]);

            $message = 'Pengajuan resmi disahkan oleh Kepala Dinas! Surat penerimaan magang telah diterbitkan.';
        } else {
            $application->update([
                'status_kadis' => 'rejected',
                'verified_by_kadis' => $request->user()->id,
                'notes_kadis' => $validated['notes'] ?? 'Pengajuan ditolak oleh Kepala Dinas.',
                'final_status' => 'rejected',
            ]);
            $message = 'Pengajuan ditolak oleh Kepala Dinas';
        }

        $application->load(['user', 'division', 'verifierKadis']);

        return $this->successResponse($application, $message);
    }
}

