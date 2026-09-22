<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Evaluation;
use App\Models\User;
use App\Traits\ApiResponse;
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

        // Check if intern has an evaluation
        $evaluation = Evaluation::where('intern_id', $intern->id)->first();
        if (! $evaluation) {
            return $this->errorResponse('Pemohon magang belum memiliki nilai evaluasi akhir dari pembimbing', 422);
        }

        // Check if certificate already generated
        $existing = Certificate::where('intern_id', $intern->id)->first();
        if ($existing) {
            $existing->load('intern.division');

            return $this->successResponse($existing, 'Sertifikat magang telah diterbitkan sebelumnya');
        }

        $certificateNumber = 'CERT/DISKOMINFO/'.date('Y').'/'.str_pad((string) $intern->id, 4, '0', STR_PAD_LEFT);
        $qrHash = hash('sha256', $intern->id.'-'.time().'-'.Str::random(16));

        $certificate = Certificate::create([
            'intern_id' => $intern->id,
            'certificate_number' => $certificateNumber,
            'qr_hash' => $qrHash,
            'issued_at' => now(),
        ]);

        $certificate->load(['intern.division']);

        return $this->successResponse($certificate, 'Sertifikat magang digital dengan kode QR berhasil diterbitkan', 201);
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
                'discipline_score' => $evaluation->discipline_score,
                'skill_score' => $evaluation->skill_score,
                'softskill_score' => $evaluation->softskill_score,
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
            ->where('intern_id', $request->user()->id)
            ->first();

        if (! $certificate) {
            return $this->successResponse(null, 'Sertifikat belum diterbitkan');
        }

        return $this->successResponse($certificate, 'Data sertifikat Anda');
    }
}

