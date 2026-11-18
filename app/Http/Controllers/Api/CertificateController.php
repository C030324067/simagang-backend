<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Evaluation;
use App\Models\InternApplication;
use App\Models\User;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    use ApiResponse;

    /**
     * Generate official certificate for intern (Mentor / Admin role).
     */
    public function generate(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin_kepegawaian', 403, 'Hanya Admin Kepegawaian yang dapat menerbitkan sertifikat.');

        $validated = $request->validate([
            'intern_id' => ['required', 'exists:users,id'],
        ]);

        $application = InternApplication::query()
            ->where('user_id', $validated['intern_id'])
            ->where('final_status', 'accepted')
            ->latest('id')
            ->first();
        $existing = $application?->certificate;
        $certificateNumber = null;
        if ($request->exists('certificate_number')) {
            $request->merge(['certificate_number' => trim((string) $request->input('certificate_number'))]);
            $numberData = $request->validate([
                'certificate_number' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('certificates', 'certificate_number')->ignore($existing?->id),
                ],
            ]);
            $certificateNumber = $numberData['certificate_number'];
        }

        $intern = User::query()->findOrFail($validated['intern_id']);

        return $this->issueForIntern($intern, $certificateNumber);
    }

    public function generateFromEvaluation(Request $request, Evaluation $evaluation): JsonResponse
    {
        $mentor = $request->user();
        if ($mentor->activeRole() !== 'mentor'
            || (int) $evaluation->mentor_id !== (int) $mentor->id
            || ! $evaluation->internApplication?->user
            || (! $mentor->division_id && (int) $evaluation->internApplication->mentor_id !== (int) $mentor->id)
            || ($mentor->division_id && (int) $evaluation->internApplication->user->division_id !== (int) $mentor->division_id)) {
            return $this->errorResponse('Anda tidak berhak menerbitkan sertifikat untuk evaluasi ini.', 403);
        }

        return $this->issueForIntern($evaluation->internApplication->user, null);
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

        $application = $certificate->internApplication;
        $evaluation = $application?->evaluation;
        $evaluation?->load('mentor');
        $educationLevel = $application?->educationLevel() ?? 'Kuliah';
        $technicalScores = $evaluation?->technical_scores ?? [];
        if ($educationLevel === 'SMK' && $technicalScores === []) {
            $technicalScores = $application?->penilaianSmk()
                ->orderBy('aspek')
                ->get()
                ->map(fn ($item): array => ['criteria' => $item->aspek, 'score' => (float) $item->nilai])
                ->all() ?? [];
        }
        $skillScores = [
            ['criteria' => 'Disiplin', 'score' => $evaluation?->score_discipline],
            ['criteria' => 'Perilaku dan Sopan Santun', 'score' => $evaluation?->score_quality],
            ['criteria' => 'Inisiatif dan Kreativitas', 'score' => $evaluation?->score_initiative],
            ['criteria' => 'Motivasi', 'score' => $evaluation?->score_teamwork],
            ['criteria' => 'Komunikasi dan Kerjasama', 'score' => $evaluation?->score_softskill],
        ];
        $verifyUrl = url('/verify-cert/'.$certificate->qr_hash);
        $qrCode = new QrCode(
            data: $verifyUrl,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: 320,
            margin: 12,
            roundBlockSizeMode: RoundBlockSizeMode::Margin,
            foregroundColor: new Color(15, 23, 42),
            backgroundColor: new Color(255, 255, 255),
        );
        $qrCodeDataUri = (new PngWriter)->write($qrCode)->getDataUri();
        $data = [
            'certificate' => $certificate,
            'intern' => $certificate->intern,
            'evaluation' => $evaluation,
            'application' => $application,
            'verify_url' => $verifyUrl,
            'qr_code_data_uri' => $qrCodeDataUri,
            'education_level' => $educationLevel,
            'technical_scores' => $technicalScores,
            'skill_scores' => $skillScores,
            'grade_description' => $this->descriptionFor((float) ($evaluation?->final_score ?? 0)),
            'grade_letter' => $this->gradeFor((float) ($evaluation?->final_score ?? 0)),
            'duration_months' => max(1, (int) ceil($application?->start_date?->diffInMonths($application->end_date) ?? 1)),
            'issued_date' => $certificate->issued_at ?? now(),
            'mentor_nip' => $evaluation?->mentor?->nip,
            'mentor_position' => $evaluation?->mentor?->position,
        ];

        $pdf = Pdf::loadView('pdf.certificate', $data)->setPaper('a4', 'landscape');

        return $pdf->download('Sertifikat-'.Str::slug($certificate->intern->name).'.pdf');
    }

    private function issueForIntern(User $intern, ?string $requestedNumber): JsonResponse
    {
        if ($intern->role !== 'intern') {
            return $this->errorResponse('Pengguna yang dipilih bukan pemohon magang.', 422);
        }

        $application = $intern->applications()
            ->where('final_status', 'accepted')
            ->latest('id')
            ->first();
        if (! $application || $application->internship_status !== 'completed') {
            return $this->errorResponse('Sertifikat dapat diterbitkan setelah penilaian akhir pembimbing disimpan.', 422);
        }

        if (! Evaluation::query()->where('intern_application_id', $application->id)->exists()) {
            return $this->errorResponse('Pemohon magang belum memiliki nilai evaluasi akhir dari pembimbing.', 422);
        }

        $existing = Certificate::query()->where('intern_application_id', $application->id)->first();
        if ($existing) {
            if ($requestedNumber !== null && $existing->certificate_number !== $requestedNumber) {
                $existing->update(['certificate_number' => $requestedNumber]);
            }
            $existing->load(['intern.division', 'internApplication']);

            return $this->successResponse($existing, 'Sertifikat magang telah diterbitkan.');
        }

        $certificateNumber = $requestedNumber ?? $this->defaultCertificateNumber($application->id);
        $certificate = Certificate::create([
            'intern_application_id' => $application->id,
            'certificate_number' => $certificateNumber,
            'qr_hash' => hash('sha256', $intern->id.'-'.now()->timestamp.'-'.Str::random(16)),
            'issued_at' => now(),
        ]);
        $certificate->load(['intern.division', 'internApplication']);

        return $this->successResponse($certificate, 'Sertifikat magang digital dengan kode QR berhasil diterbitkan.', 201);
    }

    private function defaultCertificateNumber(int $applicationId): string
    {
        $romanMonths = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'];

        return sprintf(
            'B-%s/Diskominfo/000.3.1/%s/%s',
            str_pad((string) $applicationId, 3, '0', STR_PAD_LEFT),
            $romanMonths[(int) now()->format('n')],
            now()->format('Y'),
        );
    }

    private function gradeFor(float $score): string
    {
        return match (true) {
            $score >= 90 => 'A',
            $score >= 75 => 'B',
            $score >= 60 => 'C',
            default => 'D',
        };
    }

    private function descriptionFor(float $score): string
    {
        return match (true) {
            $score >= 90 => 'SANGAT BAIK',
            $score >= 75 => 'BAIK',
            $score >= 60 => 'CUKUP',
            default => 'KURANG',
        };
    }
}
