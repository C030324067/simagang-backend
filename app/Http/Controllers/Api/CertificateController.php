<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Evaluation;
use App\Models\User;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    use ApiResponse;

    /**
     * Generate official certificate for intern (Mentor / Admin role).
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'intern_id' => ['required', 'exists:users,id'],
        ]);

        $intern = User::with(['division', 'activeApplication'])->findOrFail($validated['intern_id']);

        if ($intern->role !== 'intern') {
            return $this->errorResponse('Pengguna yang dipilih bukan pemohon magang', 422);
        }

        $application = $intern->applications()
            ->where('final_status', 'accepted')
            ->latest('id')
            ->first();

        if (! $application || $application->internship_status !== 'completed') {
            return $this->errorResponse('Sertifikat dapat diterbitkan setelah penilaian akhir pembimbing disimpan.', 422);
        }

        // Check if intern has an evaluation
        $evaluation = Evaluation::where('intern_application_id', $application->id)->first();
        if (! $evaluation) {
            return $this->errorResponse('Pemohon magang belum memiliki nilai evaluasi akhir dari pembimbing', 422);
        }

        // Check if certificate already generated
        $existing = Certificate::where('intern_application_id', $application->id)->first();
        if ($existing) {
            $existing->load('intern.division');

            return $this->successResponse($existing, 'Sertifikat magang telah diterbitkan sebelumnya');
        }

        $certificateNumber = 'CERT/DISKOMINFO/'.date('Y').'/'.str_pad((string) $intern->id, 4, '0', STR_PAD_LEFT);
        $qrHash = hash('sha256', $intern->id.'-'.time().'-'.Str::random(16));

        $certificate = Certificate::create([
            'intern_application_id' => $application->id,
            'certificate_number' => $certificateNumber,
            'qr_hash' => $qrHash,
            'issued_at' => now(),
        ]);

        $certificate->load(['intern.division']);

        return $this->successResponse($certificate, 'Sertifikat magang digital dengan kode QR berhasil diterbitkan', 201);
    }

    public function generateFromEvaluation(Request $request, Evaluation $evaluation): JsonResponse
    {
        $mentor = $request->user();
        if ($mentor->role !== 'mentor'
            || (int) $evaluation->mentor_id !== (int) $mentor->id
            || ! $mentor->division_id
            || (int) $evaluation->internApplication?->user?->division_id !== (int) $mentor->division_id) {
            return $this->errorResponse('Anda tidak berhak menerbitkan sertifikat untuk evaluasi ini.', 403);
        }

        $request->merge(['intern_id' => $evaluation->internApplication?->user_id]);

        return $this->generate($request);
    }

    /**
     * Public verification endpoint for QR code validation.
     */
    public function verify(string $hash): JsonResponse
    {
        $certificate = Certificate::with(['intern.division', 'intern.evaluations.mentor', 'intern.activeApplication'])
            ->where('qr_hash', $hash)
            ->first();

        if (! $certificate) {
            return $this->errorResponse('Sertifikat digital tidak ditemukan atau kode QR tidak valid pada basis data Diskominfo', 404);
        }

        $evaluation = $certificate->intern->evaluations->first();
        $application = $certificate->intern->activeApplication;

        $data = [
            'valid' => true,
            'certificate_number' => $certificate->certificate_number,
            'qr_hash' => $certificate->qr_hash,
            'issued_at' => $certificate->issued_at?->format('d F Y, H:i:s T'),
            'intern' => [
                'name' => $certificate->intern->name,
                'email' => $certificate->intern->email,
                'institution' => $application?->institution_name ?? 'Peserta Magang',
                'division' => $certificate->intern->division?->name ?? 'Dinas Kominfo',
            ],
            'evaluation' => $evaluation ? [
                'score_discipline' => $evaluation->score_discipline,
                'score_quality' => $evaluation->score_quality,
                'score_softskill' => $evaluation->score_softskill,
                'final_score' => $evaluation->final_score,
                'mentor_name' => $evaluation->mentor?->name ?? 'Pembimbing Lapangan',
            ] : null,
            'issued_by' => 'Dinas Komunikasi dan Informatika (Diskominfo)',
        ];

        return $this->successResponse($data, 'Sertifikat resmi terverifikasi dan valid di Diskominfo');
    }

    /**
     * Get current intern's certificate.
     */
    public function myCertificate(Request $request): JsonResponse
    {
        $certificate = Certificate::with(['intern.division', 'intern.evaluations.mentor', 'intern.activeApplication'])
            ->whereHas('internApplication', fn ($q) => $q->where('user_id', $request->user()->id))
            ->first();

        if (! $certificate) {
            return $this->successResponse(null, 'Sertifikat belum diterbitkan');
        }

        return $this->successResponse($certificate, 'Data sertifikat Anda');
    }

    /**
     * Render & download official certificate PDF dynamically.
     */
    public function downloadPdf(Request $request, string $id)
    {
        $certificate = Certificate::with(['intern.division', 'intern.evaluations.mentor', 'intern.activeApplication'])
            ->findOrFail($id);

        if ($request->user()->role === 'intern'
            && (int) $certificate->internApplication()->value('user_id') !== (int) $request->user()->id) {
            abort(404);
        }

        $data = [
            'certificate' => $certificate,
            'intern' => $certificate->intern,
            'evaluation' => $certificate->intern->evaluations->first(),
            'application' => $certificate->intern->activeApplication,
            'verify_url' => url('/verify-cert/' . $certificate->qr_hash),
        ];

        $pdf = Pdf::loadView('pdf.certificate', $data)->setPaper('a4', 'landscape');

        return $pdf->download('Sertifikat-' . Str::slug($certificate->intern->name) . '.pdf');
    }
}
