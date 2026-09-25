<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OfficialAcceptanceLetter;
use App\Models\InternApplication;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

        if (in_array($request->user()->role, ['kabid', 'mentor'], true) && $request->user()->division_id) {
            $query->where('division_id', $request->user()->division_id);
        }

        $applications = $query->paginate($request->input('per_page', 15));

        return $this->successResponse($applications, 'Daftar pengajuan magang berhasil dimuat');
    }

    /**
     * Get single application details.
     */
    public function show(Request $request, InternApplication $application): JsonResponse
    {
        abort_unless(
            $request->user()->role !== 'intern'
                || (int) $application->user_id === (int) $request->user()->id,
            403,
        );
        if (in_array($request->user()->role, ['kabid', 'mentor'], true)) {
            abort_unless($application->division_id === $request->user()->division_id, 404);
        }

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
            'status' => 'pending_kepegawaian',
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

    public function kepegawaian(): JsonResponse
    {
        $applications = InternApplication::with(['user', 'division'])
            ->whereIn('status', ['pending_kepegawaian', 'approved_kadis'])
            ->latest()->get();

        return $this->successResponse($applications, 'Antrean Kepegawaian berhasil dimuat.');
    }

    public function kabid(Request $request): JsonResponse
    {
        $query = InternApplication::with(['user', 'division'])->where('status', 'review_kabid');
        if ($request->user()->division_id) {
            $query->where('division_id', $request->user()->division_id);
        }

        return $this->successResponse($query->latest()->get(), 'Antrean peninjauan bidang berhasil dimuat.');
    }

    public function kadis(): JsonResponse
    {
        $applications = InternApplication::with(['user', 'division'])
            ->where('status', 'review_kadis')->latest()->get();

        return $this->successResponse($applications, 'Antrean persetujuan Kadis berhasil dimuat.');
    }

    public function updateStatus(Request $request, InternApplication $application): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['review_kabid', 'review_kadis', 'approved_kadis', 'rejected'])],
            'rejection_note' => ['nullable', 'string', 'max:2000'],
            'division_id' => ['nullable', 'exists:divisions,id'],
        ]);

        $user = $request->user();
        $nextStatus = $validated['status'];
        $isRejection = $nextStatus === 'rejected';
        $expectedTransition = match ($user->role) {
            'admin_kepegawaian' => $application->status === 'pending_kepegawaian'
                && ($isRejection || ($nextStatus === 'review_kabid' && ! empty($validated['division_id']))),
            'kabid', 'mentor' => $application->status === 'review_kabid'
                && ($isRejection || $nextStatus === 'review_kadis'),
            'kadis' => $application->status === 'review_kadis'
                && ($isRejection || $nextStatus === 'approved_kadis'),
            default => false,
        };

        if (! $expectedTransition) {
            return $this->errorResponse('Transisi status tidak diizinkan untuk peran atau status aplikasi saat ini.', 422);
        }

        if (in_array($user->role, ['kabid', 'mentor'], true) && $user->division_id
            && (int) $application->division_id !== (int) $user->division_id) {
            return $this->errorResponse('Aplikasi ini berada di luar bidang Anda.', 403);
        }

        DB::transaction(function () use ($application, $user, $validated, $nextStatus, $isRejection): void {
            $lockedApplication = InternApplication::query()->lockForUpdate()->findOrFail($application->id);
            if ($lockedApplication->status !== $application->status) {
                abort(409, 'Status aplikasi telah berubah. Muat ulang antrean.');
            }

            $changes = ['status' => $nextStatus];
            if ($isRejection) {
                $changes['rejection_note'] = $validated['rejection_note'] ?? null;
                $changes['final_status'] = 'rejected';
                $changes += match ($user->role) {
                    'admin_kepegawaian' => [
                        'status_kepegawaian' => 'rejected',
                        'verified_by_kepegawaian' => $user->id,
                        'notes_kepegawaian' => $validated['rejection_note'] ?? 'Pengajuan ditolak oleh Kepegawaian.',
                    ],
                    'kabid', 'mentor' => [
                        'status_kabid' => 'rejected',
                        'verified_by_kabid' => $user->id,
                        'notes_kabid' => $validated['rejection_note'] ?? 'Pengajuan ditolak oleh peninjau bidang.',
                    ],
                    'kadis' => [
                        'status_kadis' => 'rejected',
                        'verified_by_kadis' => $user->id,
                        'notes_kadis' => $validated['rejection_note'] ?? 'Pengajuan ditolak oleh Kadis.',
                    ],
                    default => [],
                };
            } elseif ($nextStatus === 'review_kabid') {
                $changes += [
                    'division_id' => $validated['division_id'],
                    'status_kepegawaian' => 'approved',
                    'verified_by_kepegawaian' => $user->id,
                    'notes_kepegawaian' => 'Berkas diteruskan ke peninjauan bidang.',
                ];
            } elseif ($nextStatus === 'review_kadis') {
                $changes += [
                    'status_kabid' => 'approved',
                    'verified_by_kabid' => $user->id,
                    'notes_kabid' => 'Permohonan diteruskan kepada Kadis.',
                ];
            } elseif ($nextStatus === 'approved_kadis') {
                $changes += [
                    'status_kadis' => 'approved',
                    'verified_by_kadis' => $user->id,
                    'notes_kadis' => 'Permohonan disetujui Kadis; menunggu surat resmi.',
                    'acceptance_letter_number' => '500.12.1/DISKOMINFO/'.date('Y').'/'.str_pad((string) $lockedApplication->id, 4, '0', STR_PAD_LEFT),
                ];
                $lockedApplication->user()->update(['division_id' => $lockedApplication->division_id]);
            }

            $lockedApplication->update($changes);
        });

        return $this->successResponse($application->fresh(['user', 'division']), 'Status permohonan berhasil diperbarui.');
    }

    /**
     * Tier 1: Admin Kepegawaian pending queue.
     */
    public function pendingKepegawaian(): JsonResponse
    {
        $applications = InternApplication::with(['user', 'division'])
            ->where('status', 'pending_kepegawaian')
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
                'status' => 'review_kabid',
                'verified_by_kepegawaian' => $request->user()->id,
                'notes_kepegawaian' => $validated['notes'] ?? 'Dokumen lengkap dan terverifikasi oleh Kepegawaian.',
                'division_id' => $validated['division_id'],
            ]);
            $message = 'Pengajuan berhasil disetujui oleh Kepegawaian dan diteruskan ke Kepala Bidang';
        } else {
            $application->update([
                'status_kepegawaian' => 'rejected',
                'status' => 'rejected',
                'rejection_note' => $validated['notes'] ?? null,
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
            ->where('status', 'review_kabid');

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
                'status' => 'review_kadis',
                'verified_by_kabid' => $request->user()->id,
                'notes_kabid' => $validated['notes'] ?? 'Penempatan teknis bidang telah disetujui.',
            ]);
            $message = 'Pengajuan berhasil disetujui oleh Kabid dan diteruskan ke Kepala Dinas';
        } else {
            $application->update([
                'status_kabid' => 'rejected',
                'status' => 'rejected',
                'rejection_note' => $validated['notes'] ?? null,
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
            ->where('status', 'review_kadis')
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
                'final_status' => 'in_review',
                'status' => 'approved_kadis',
                'acceptance_letter_number' => $letterNumber,
            ]);

            // Assign division to user
            $application->user()->update([
                'division_id' => $application->division_id,
            ]);

            $message = 'Permohonan disetujui oleh Kepala Dinas dan menunggu unggahan surat resmi.';
        } else {
            $application->update([
                'status_kadis' => 'rejected',
                'status' => 'rejected',
                'rejection_note' => $validated['notes'] ?? null,
                'verified_by_kadis' => $request->user()->id,
                'notes_kadis' => $validated['notes'] ?? 'Pengajuan ditolak oleh Kepala Dinas.',
                'final_status' => 'rejected',
            ]);
            $message = 'Pengajuan ditolak oleh Kepala Dinas';
        }

        $application->load(['user', 'division', 'verifierKadis']);

        return $this->successResponse($application, $message);
    }

    public function pendingLetters(): JsonResponse
    {
        $applications = InternApplication::with(['user', 'division'])
            ->where('status', 'approved_kadis')->latest()->get();

        return $this->successResponse($applications, 'Daftar surat penerimaan yang perlu diunggah.');
    }

    public function uploadOfficialLetter(Request $request, InternApplication $application): JsonResponse
    {
        if ($application->status !== 'approved_kadis') {
            return $this->errorResponse('Surat hanya dapat diunggah setelah persetujuan Kadis.', 422);
        }

        $validated = $request->validate([
            'official_letter' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);
        $newPath = $validated['official_letter']->store('letters', 'public');
        $oldPath = $application->official_letter_path;

        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            Storage::disk('public')->delete($newPath);

            return $this->errorResponse('Pengiriman email belum dikonfigurasi. Atur MAIL_MAILER ke SMTP atau layanan email sebelum menerbitkan surat.', 503);
        }

        $application->loadMissing(['user', 'division']);
        try {
            Mail::to($application->user->email)->send(new OfficialAcceptanceLetter($application, $newPath));
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($newPath);
            report($exception);

            return $this->errorResponse('Surat tersimpan belum dapat dikirim melalui email. Periksa konfigurasi email lalu unggah ulang.', 503);
        }

        $application->update([
            'official_letter_path' => $newPath,
            'status' => 'accepted',
            'final_status' => 'accepted',
        ]);
        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return $this->successResponse($application->fresh(['user', 'division']), 'Surat resmi berhasil dikirim ke email pemohon dan permohonan ditandai diterima.');
    }

    public function downloadOfficialLetter(Request $request, InternApplication $application): StreamedResponse
    {
        abort_unless((int) $application->user_id === (int) $request->user()->id, 403);
        abort_unless($application->status === 'accepted' && $application->official_letter_path, 404);

        return Storage::disk('public')->download($application->official_letter_path, 'surat-penerimaan-magang.pdf');
    }
}
