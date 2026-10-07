<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OfficialAcceptanceLetter;
use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
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

        if ($request->user()->role === 'kabid') {
            if (! $request->user()->division_id) {
                return $this->errorResponse('Akun Kepala Bidang belum terhubung dengan bidang.', 403);
            }

            $query->where('division_id', $request->user()->division_id)
                ->whereHas('user', fn ($query) => $query
                    ->where('role', 'applicant')
                    ->where('division_id', $request->user()->division_id));
        }

        if ($request->filled('final_status')) {
            $query->where('final_status', $request->input('final_status'));
        }

        if ($request->filled('division_id')) {
            $query->where('division_id', $request->input('division_id'));
        }

        if ($request->filled('application_type')) {
            $query->where('application_type', $request->input('application_type'));
        }

        if ($request->user()->role === 'mentor') {
            if (! $request->user()->division_id) {
                return $this->errorResponse('Akun mentor belum terhubung dengan divisi.', 403);
            }

            $query->where('final_status', 'accepted')
                ->where('division_id', $request->user()->division_id)
                ->whereHas('user', fn ($query) => $query
                    ->where('role', 'intern')
                    ->where('status_akun', 'approved')
                    ->where('division_id', $request->user()->division_id));
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
        if ($request->user()->role === 'kabid') {
            abort_unless(
                $request->user()->division_id
                    && (int) $application->division_id === (int) $request->user()->division_id,
                404,
            );
            abort_unless(
                $application->user()
                    ->where('role', 'applicant')
                    ->where('division_id', $request->user()->division_id)
                    ->exists(),
                404,
            );
        }

        if ($request->user()->role === 'mentor') {
            abort_unless(
                $request->user()->division_id
                    && (int) $application->division_id === (int) $request->user()->division_id
                    && $application->final_status === 'accepted'
                    && $application->user()
                        ->where('role', 'intern')
                        ->where('status_akun', 'approved')
                        ->where('division_id', $request->user()->division_id)
                        ->exists(),
                404,
            );
        }

        $application->load(['user', 'division', 'verifierKepegawaian', 'verifierKabid', 'verifierKadis']);

        return $this->successResponse($application, 'Detail pengajuan magang berhasil dimuat');
    }

    public function document(InternApplication $application, string $document): BinaryFileResponse
    {
        $filePath = match ($document) {
            'proposal' => $application->cover_letter_path ?: $application->file_proposal,
            'cv' => $application->file_cv,
            'transcript' => $application->transcript_path ?: $application->file_recommendation_letter,
            'student-card' => $application->student_card_path,
            default => null,
        };

        abort_if(! $filePath || ! Storage::disk('public')->exists($filePath), 404, 'Berkas tidak ditemukan.');

        $mimeType = Storage::disk('public')->mimeType($filePath) ?: 'application/octet-stream';

        return response()->file(Storage::disk('public')->path($filePath), [
            'Content-Type' => $mimeType,
            'X-Content-Type-Options' => 'nosniff',
        ]);
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
            ->with('mentor:id,name,role')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->first();

        if (! $application) {
            return $this->successResponse(null, 'Belum ada pengajuan magang yang diajukan');
        }

        return $this->successResponse($application, 'Data pengajuan magang Anda');
    }

    /** Return the limited public status view authorized by an applicant tracking code. */
    public function track(string $code): JsonResponse
    {
        $application = InternApplication::query()
            ->where('tracking_code', $code)
            ->first();

        if (! $application) {
            return response()->json([
                'message' => 'Kode tracking tidak ditemukan. Silakan periksa kembali kode Anda.',
            ], 404);
        }

        $rejectedStage = match (true) {
            $application->status_kepegawaian === 'rejected' => 'kepegawaian',
            $application->status_kabid === 'rejected' => 'kabid',
            $application->status_kadis === 'rejected' => 'kadis',
            default => null,
        };

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $application->status,
                'rejected_at_stage' => $rejectedStage,
                'rejection_reason' => $application->rejection_note,
                'acceptance_letter_url' => $application->status === 'accepted' && $application->official_letter_path
                    ? URL::temporarySignedRoute('applications.tracking-letter', now()->addDays(30), ['trackingCode' => $code])
                    : null,
            ],
        ]);
    }

    /** Download an accepted applicant's letter using its expiring signed tracking URL. */
    public function downloadTrackingLetter(string $trackingCode): StreamedResponse
    {
        $application = InternApplication::query()
            ->where('tracking_code', $trackingCode)
            ->where('status', 'accepted')
            ->firstOrFail();

        abort_unless($application->official_letter_path, 404);

        return Storage::disk('public')->download($application->official_letter_path, 'surat-penerimaan-magang.pdf');
    }

    public function kepegawaian(): JsonResponse
    {
        $applications = InternApplication::with(['user', 'division'])
            ->whereIn('status', ['pending_kepegawaian', 'approved_by_kadis', 'approved_kadis'])
            ->latest()->get();

        return $this->successResponse($applications, 'Antrean Kepegawaian berhasil dimuat.');
    }

    public function kabid(Request $request): JsonResponse
    {
        if (! $request->user()->division_id) {
            return $this->errorResponse('Akun Kepala Bidang belum terhubung dengan bidang.', 403);
        }

        $query = InternApplication::with(['user', 'division', 'mentor:id,name,role'])
            ->whereIn('status', ['pending_kabid', 'review_kabid'])
            ->where('division_id', $request->user()->division_id)
            ->whereHas('user', fn ($query) => $query
                ->where('role', 'applicant')
                ->where('division_id', $request->user()->division_id));

        return $this->successResponse($query->latest()->get(), 'Antrean peninjauan bidang berhasil dimuat.');
    }

    public function mentors(Request $request, InternApplication $application): JsonResponse
    {
        $kabid = $request->user();
        if (! $kabid->division_id || (int) $application->division_id !== (int) $kabid->division_id) {
            return $this->errorResponse('Aplikasi ini berada di luar bidang Anda.', 403);
        }

        if (! in_array($application->status, ['pending_kabid', 'review_kabid'], true)
            || ! $application->user()
                ->where('role', 'applicant')
                ->where('division_id', $kabid->division_id)
                ->exists()) {
            return $this->errorResponse('Pengajuan tidak tersedia untuk penunjukan pembimbing.', 404);
        }

        $mentors = User::query()
            ->where('division_id', $kabid->division_id)
            ->where('status_akun', 'approved')
            ->where(function ($query) use ($kabid): void {
                $query->where('role', 'mentor')->orWhere('id', $kabid->id);
            })
            ->orderByRaw('CASE WHEN id = ? THEN 0 ELSE 1 END', [$kabid->id])
            ->orderBy('name')
            ->get(['id', 'name', 'role']);

        return $this->successResponse($mentors, 'Daftar pembimbing bidang berhasil dimuat.');
    }

    public function kadis(): JsonResponse
    {
        $applications = InternApplication::with(['user', 'division'])
            ->whereIn('status', ['review_kadis', 'pending_kadis'])->latest()->get();

        return $this->successResponse($applications, 'Antrean persetujuan Kadis berhasil dimuat.');
    }

    public function updateStatus(Request $request, InternApplication $application): JsonResponse
    {
        $user = $request->user();
        $approvingAsKabid = $user->role === 'kabid'
            && in_array($request->input('status'), ['pending_kadis', 'review_kadis'], true);
        $mentorRule = Rule::exists('users', 'id')->where(function ($query) use ($user): void {
            $query->where('division_id', $user->division_id)
                ->where('status_akun', 'approved')
                ->where(function ($query) use ($user): void {
                    $query->where('role', 'mentor')->orWhere('id', $user->id);
                });
        });

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending_kabid', 'review_kabid', 'pending_kadis', 'review_kadis', 'approved_by_kadis', 'approved_kadis', 'rejected'])],
            'rejection_note' => ['nullable', 'string', 'max:2000'],
            'division_id' => ['nullable', 'exists:divisions,id'],
            'mentor_id' => [
                Rule::requiredIf($approvingAsKabid),
                Rule::prohibitedIf($user->role !== 'kabid'),
                'nullable',
                'integer',
                $mentorRule,
            ],
        ]);

        $nextStatus = match ($validated['status']) {
            'review_kabid' => 'pending_kabid',
            'review_kadis' => 'pending_kadis',
            'approved_kadis' => 'approved_by_kadis',
            default => $validated['status'],
        };
        $isRejection = $nextStatus === 'rejected';
        $expectedTransition = match ($user->role) {
            'admin_kepegawaian' => $application->status === 'pending_kepegawaian'
                && ($isRejection || ($nextStatus === 'pending_kabid' && ! empty($validated['division_id']))),
            'kabid' => in_array($application->status, ['pending_kabid', 'review_kabid'], true)
                && ($isRejection || $nextStatus === 'pending_kadis'),
            'kadis' => in_array($application->status, ['pending_kadis', 'review_kadis'], true)
                && ($isRejection || $nextStatus === 'approved_by_kadis'),
            default => false,
        };

        if (! $expectedTransition) {
            return $this->errorResponse('Transisi status tidak diizinkan untuk peran atau status aplikasi saat ini.', 422);
        }

        if ($user->role === 'kabid'
            && (! $user->division_id || (int) $application->division_id !== (int) $user->division_id)) {
            return $this->errorResponse('Aplikasi ini berada di luar bidang Anda.', 403);
        }

        if ($user->role === 'kabid'
            && ! $application->user()
                ->where('role', 'applicant')
                ->where('division_id', $user->division_id)
                ->exists()) {
            return $this->errorResponse('Pengajuan pemohon tidak ditemukan.', 404);
        }

        if (($user->role === 'admin_kepegawaian' && $nextStatus === 'pending_kabid')
            || ($user->role === 'kabid' && $nextStatus === 'pending_kadis')) {
            $divisionId = $user->role === 'admin_kepegawaian'
                ? (int) $validated['division_id']
                : (int) $application->division_id;

            if (! $this->divisionHasRemainingQuota($divisionId)) {
                return $this->errorResponse('Kuota untuk bidang ini sudah penuh.', 422);
            }
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
                    'kabid' => [
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
            } elseif ($nextStatus === 'pending_kabid') {
                $changes += [
                    'division_id' => $validated['division_id'],
                    'status_kepegawaian' => 'approved',
                    'verified_by_kepegawaian' => $user->id,
                    'notes_kepegawaian' => 'Berkas diteruskan ke peninjauan bidang.',
                ];
                $lockedApplication->user()->update(['division_id' => $validated['division_id']]);
            } elseif ($nextStatus === 'pending_kadis') {
                $changes += [
                    'status_kabid' => 'approved',
                    'verified_by_kabid' => $user->id,
                    'notes_kabid' => 'Permohonan diteruskan kepada Kadis.',
                    'mentor_id' => $validated['mentor_id'],
                ];
            } elseif ($nextStatus === 'approved_by_kadis') {
                $changes += [
                    'status_kadis' => 'approved',
                    'verified_by_kadis' => $user->id,
                    'notes_kadis' => $validated['rejection_note'] ?? 'Permohonan diotorisasi Kadis; menunggu penerbitan surat oleh Kepegawaian.',
                ];
                $lockedApplication->user()->update(['division_id' => $lockedApplication->division_id]);
            }

            $lockedApplication->update($changes);
        });

        return $this->successResponse($application->fresh(['user', 'division', 'mentor']), 'Status permohonan berhasil diperbarui.');
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
            if (! $this->divisionHasRemainingQuota((int) $validated['division_id'])) {
                return $this->errorResponse('Kuota untuk bidang ini sudah penuh.', 422);
            }

            DB::transaction(function () use ($application, $request, $validated): void {
                $application->update([
                    'status_kepegawaian' => 'approved',
                    'status' => 'pending_kabid',
                    'verified_by_kepegawaian' => $request->user()->id,
                    'notes_kepegawaian' => $validated['notes'] ?? 'Dokumen lengkap dan terverifikasi oleh Kepegawaian.',
                    'division_id' => $validated['division_id'],
                ]);
                $application->user()->update(['division_id' => $validated['division_id']]);
            });
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
        if (! $request->user()->division_id) {
            return $this->errorResponse('Akun Kepala Bidang belum terhubung dengan bidang.', 403);
        }

        $query = InternApplication::with(['user', 'division'])
            ->whereIn('status', ['pending_kabid', 'review_kabid'])
            ->where('division_id', $request->user()->division_id)
            ->whereHas('user', fn ($query) => $query
                ->where('role', 'applicant')
                ->where('division_id', $request->user()->division_id));

        $applications = $query->latest()->get();

        return $this->successResponse($applications, 'Daftar pengajuan menunggu verifikasi teknis Kepala Bidang');
    }

    /**
     * Tier 2: Kabid Approve or Reject.
     */
    public function approveKabid(Request $request, InternApplication $application): JsonResponse
    {
        if (! $request->user()->division_id
            || (int) $application->division_id !== (int) $request->user()->division_id) {
            return $this->errorResponse('Aplikasi ini berada di luar bidang Anda.', 403);
        }

        if (! $application->user()
            ->where('role', 'applicant')
            ->where('division_id', $request->user()->division_id)
            ->exists()) {
            return $this->errorResponse('Pengajuan pemohon tidak ditemukan.', 404);
        }

        if ($application->status_kepegawaian !== 'approved') {
            return $this->errorResponse('Pengajuan harus disetujui oleh kepegawaian terlebih dahulu', 422);
        }

        if ($application->status_kabid !== 'pending') {
            return $this->errorResponse('Pengajuan ini telah diproses oleh Kepala Bidang sebelumnya', 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'notes' => ['nullable', 'string', 'max:1000'],
            'mentor_id' => [
                Rule::requiredIf($request->input('status') === 'approved'),
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(function ($query) use ($request): void {
                    $query->where('division_id', $request->user()->division_id)
                        ->where('status_akun', 'approved')
                        ->where(function ($query) use ($request): void {
                            $query->where('role', 'mentor')->orWhere('id', $request->user()->id);
                        });
                }),
            ],
        ]);

        if ($validated['status'] === 'approved') {
            if (! $this->divisionHasRemainingQuota((int) $request->user()->division_id)) {
                return $this->errorResponse('Kuota untuk bidang ini sudah penuh.', 422);
            }

            $application->update([
                'status_kabid' => 'approved',
                'status' => 'pending_kadis',
                'verified_by_kabid' => $request->user()->id,
                'notes_kabid' => $validated['notes'] ?? 'Penempatan teknis bidang telah disetujui.',
                'mentor_id' => $validated['mentor_id'],
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
            ->whereIn('status', ['pending_kadis', 'review_kadis'])
            ->latest()
            ->get();

        return $this->successResponse($applications, 'Daftar pengajuan menunggu otorisasi akhir Kepala Dinas');
    }

    /**
     * Tier 3: Kadis final authorization only. Letter issuance is handled by Kepegawaian.
     */
    public function approveKadis(Request $request, InternApplication $application): JsonResponse
    {
        if (! in_array($application->status, ['pending_kadis', 'review_kadis'], true)) {
            return $this->errorResponse('Pengajuan tidak berada pada tahap otorisasi Kepala Dinas.', 422);
        }

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
            $application->update([
                'status_kadis' => 'approved',
                'verified_by_kadis' => $request->user()->id,
                'notes_kadis' => $validated['notes'] ?? 'Permohonan diotorisasi Kadis; menunggu penerbitan surat oleh Kepegawaian.',
                'final_status' => 'in_review',
                'status' => 'approved_by_kadis',
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
            ->whereIn('status', ['approved_by_kadis', 'approved_kadis'])->latest()->get();

        return $this->successResponse($applications, 'Daftar surat penerimaan yang perlu diunggah.');
    }

    public function uploadOfficialLetter(Request $request, InternApplication $application): JsonResponse
    {
        if (! in_array($application->status, ['approved_by_kadis', 'approved_kadis'], true)) {
            return $this->errorResponse('Surat hanya dapat diunggah setelah persetujuan Kadis.', 422);
        }

        if (! $application->division_id) {
            return $this->errorResponse('Permohonan belum memiliki divisi penempatan.', 422);
        }

        if (! $this->divisionHasRemainingQuota((int) $application->division_id)) {
            return $this->errorResponse('Kuota untuk bidang ini sudah penuh.', 422);
        }

        if (! $request->has('official_letter_number') && $request->has('letter_number')) {
            $request->merge(['official_letter_number' => $request->input('letter_number')]);
        }

        if (! $request->hasFile('official_letter_file') && $request->hasFile('file')) {
            $request->files->set('official_letter_file', $request->file('file'));
        }

        $validated = $request->validate([
            'official_letter_number' => ['required', 'string', 'max:255', Rule::unique('intern_applications', 'official_letter_number')->ignore($application->id)],
            'official_letter_file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ]);
        $newPath = $validated['official_letter_file']->store('letters', 'public');
        $oldPath = $application->official_letter_path;

        $application->loadMissing(['user', 'division']);
        try {
            $quotaAvailable = DB::transaction(function () use ($application, $newPath, $validated): bool {
                $division = Division::query()->lockForUpdate()->findOrFail($application->division_id);
                if ($division->remainingQuota() <= 0) {
                    return false;
                }

                $application->update([
                    'official_letter_path' => $newPath,
                    'official_letter_number' => $validated['official_letter_number'],
                    'acceptance_letter_number' => $validated['official_letter_number'],
                    'status' => 'accepted',
                    'final_status' => 'accepted',
                ]);

                $application->user()->update([
                    'role' => 'intern',
                    'status_akun' => 'approved',
                    'tanggal_disetujui' => now(),
                    'division_id' => $application->division_id,
                ]);

                return true;
            });

            if (! $quotaAvailable) {
                Storage::disk('public')->delete($newPath);

                return $this->errorResponse('Kuota untuk bidang ini sudah penuh.', 422);
            }
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($newPath);
            report($exception);

            return $this->errorResponse('Surat gagal diproses. Silakan unggah kembali.', 500);
        }

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        $emailSent = false;
        if (! in_array(config('mail.default'), ['log', 'array'], true)) {
            try {
                Mail::to($application->user->email)->send(new OfficialAcceptanceLetter($application->fresh(['user', 'division']), $newPath));
                $emailSent = true;
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        $message = $emailSent
            ? 'Nomor surat dan surat penerimaan berhasil diterbitkan, dikirim melalui email, dan akun peserta telah diaktifkan.'
            : 'Nomor surat dan surat penerimaan berhasil diterbitkan dan akun peserta telah diaktifkan. Peserta dapat mengunduh surat melalui pelacak status.';

        return $this->successResponse($application->fresh(['user', 'division']), $message);
    }

    public function issueLetter(Request $request, InternApplication $application): JsonResponse
    {
        return $this->uploadOfficialLetter($request, $application);
    }

    public function downloadOfficialLetter(Request $request, InternApplication $application): StreamedResponse
    {
        abort_unless((int) $application->user_id === (int) $request->user()->id, 403);
        abort_unless($application->status === 'accepted' && $application->official_letter_path, 404);

        return Storage::disk('public')->download($application->official_letter_path, 'surat-penerimaan-magang.pdf');
    }

    public function cetakSuratBalasan(Request $request, int $id): Response
    {
        $application = InternApplication::with(['user', 'division', 'verifierKadis'])->findOrFail($id);

        abort_unless(
            $application->status === 'accepted' && $application->final_status === 'accepted',
            404,
            'Surat hanya tersedia untuk permohonan yang telah diterima.',
        );

        if ($request->user()->role === 'kabid') {
            abort_unless(
                $request->user()->division_id
                    && (int) $application->division_id === (int) $request->user()->division_id
                    && $application->user?->role === 'intern',
                404,
            );
        }

        abort_if(! $application->user || ! $application->division, 422, 'Data pendaftar atau divisi penempatan tidak lengkap.');

        if (! $application->acceptance_letter_number) {
            $application->acceptance_letter_number = $application->official_letter_number
                ?: sprintf('SIMAGANG/%04d/%06d', now()->year, $application->id);
            $application->save();
        }

        $filename = 'Surat-Balasan-'.(Str::slug($application->user->name) ?: 'pendaftar').'.pdf';

        return Pdf::loadView('pdf.surat_penerimaan', [
            'pendaftar' => $application,
            'tanggalPenerbitan' => now()->locale('id'),
        ])->setPaper('a4', 'portrait')->download($filename);
    }

    private function divisionHasRemainingQuota(int $divisionId): bool
    {
        $division = Division::query()->find($divisionId);

        return $division !== null && $division->remainingQuota() > 0;
    }
}
