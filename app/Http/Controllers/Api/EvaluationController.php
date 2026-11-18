<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\InternApplication;
use App\Models\Logbook;
use App\Models\Task;
use App\Models\User;
use App\Services\EffectiveWorkingDaysCalculator;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class EvaluationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Evaluation::with(['intern.division', 'mentor', 'internApplication.certificate'])->latest();

        $activeRole = $user->activeRole();
        if ($activeRole === 'intern') {
            $query->whereHas('internApplication', fn ($q) => $q->where('user_id', $user->id));
        } elseif ($activeRole === 'mentor') {
            $query->where('mentor_id', $user->id);
        }

        return $this->successResponse($query->paginate($request->input('per_page', 15)), 'Daftar evaluasi akhir berhasil dimuat.');
    }

    public function show(Request $request, User $intern): JsonResponse
    {
        if ($request->user()->activeRole() === 'mentor'
            && (! $request->user()->division_id || (int) $intern->division_id !== (int) $request->user()->division_id)) {
            return $this->errorResponse('Anda tidak berhak melihat evaluasi peserta dari divisi lain.', 403);
        }

        if ($request->user()->activeRole() === 'intern' && (int) $intern->id !== (int) $request->user()->id) {
            return $this->errorResponse('Anda tidak berhak melihat evaluasi peserta lain.', 403);
        }

        $evaluation = Evaluation::with(['intern.division', 'mentor', 'internApplication.certificate'])->whereHas('internApplication', fn ($q) => $q->where('user_id', $intern->id))->latest('id')->first();
        if (! $evaluation) {
            return $this->errorResponse('Evaluasi akhir peserta belum tersedia.', 404);
        }

        return $this->successResponse($evaluation, 'Detail evaluasi akhir peserta.');
    }

    public function metrics(Request $request, User $intern, EffectiveWorkingDaysCalculator $workingDays): JsonResponse
    {
        $actor = $request->user();
        $canViewMetrics = $actor->activeRole() === 'intern'
            ? (int) $actor->id === (int) $intern->id
            : $this->mentorCanReview($actor, $intern);
        if (! $canViewMetrics) {
            return $this->errorResponse('Anda tidak berhak melihat metrik peserta ini.', 403);
        }

        try {
            return $this->successResponse($this->buildMetrics($intern, $workingDays), 'Metrik perkembangan peserta berhasil dihitung.');
        } catch (Throwable $exception) {
            Log::warning('Gagal menghitung metrik evaluasi akhir.', [
                'intern_id' => $intern->id,
                'message' => $exception->getMessage(),
            ]);

            return $this->errorResponse('Metrik hari kerja belum dapat dihitung. Coba lagi nanti.', 503);
        }
    }

    public function store(Request $request, EffectiveWorkingDaysCalculator $workingDays): JsonResponse
    {
        $validated = $request->validate([
            'intern_id' => ['required', 'integer', 'exists:users,id'],
            'score_discipline' => ['required', 'numeric', 'min:0', 'max:100'],
            'score_quality' => ['required', 'numeric', 'min:0', 'max:100'],
            'score_initiative' => ['required', 'numeric', 'min:0', 'max:100'],
            'score_teamwork' => ['required', 'numeric', 'min:0', 'max:100'],
            'score_softskill' => ['required', 'numeric', 'min:0', 'max:100'],
            'technical_scores' => ['nullable', 'array', 'max:7'],
            'technical_scores.*.criteria' => ['required', 'string', 'max:255', 'distinct'],
            'technical_scores.*.score' => ['required', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $mentor = $request->user();
        $intern = User::query()->where('role', 'intern')->find($validated['intern_id']);
        if (! $intern) {
            return $this->errorResponse('Peserta magang tidak ditemukan.', 422);
        }
        if (! $this->mentorCanReview($mentor, $intern)) {
            return $this->errorResponse('Anda tidak berhak menilai peserta dari divisi lain.', 403);
        }

        $application = InternApplication::query()
            ->where('user_id', $intern->id)
            ->where('final_status', 'accepted')
            ->latest('id')
            ->first();
        if (! $application) {
            return $this->errorResponse('Peserta belum memiliki periode magang yang disetujui.', 422);
        }

        $isSmk = $application->educationLevel() === 'SMK';
        $technicalScores = $validated['technical_scores'] ?? [];
        if ($isSmk && count($technicalScores) === 0) {
            throw ValidationException::withMessages([
                'technical_scores' => 'Peserta SMK wajib memiliki minimal satu nilai teknis.',
            ]);
        }
        if (! $isSmk && count($technicalScores) > 0) {
            throw ValidationException::withMessages([
                'technical_scores' => 'Nilai teknis hanya digunakan untuk peserta SMK.',
            ]);
        }

        $technicalScores = array_map(static fn (array $item): array => [
            'criteria' => trim($item['criteria']),
            'score' => (float) $item['score'],
        ], $technicalScores);
        if (collect($technicalScores)->contains(static fn (array $item): bool => $item['criteria'] === '')) {
            throw ValidationException::withMessages([
                'technical_scores' => 'Nama aspek teknis tidak boleh kosong.',
            ]);
        }
        $normalizedCriteria = array_map(static fn (array $item): string => mb_strtolower($item['criteria']), $technicalScores);
        if (count(array_unique($normalizedCriteria)) !== count($normalizedCriteria)) {
            throw ValidationException::withMessages([
                'technical_scores' => 'Nama aspek teknis tidak boleh duplikat.',
            ]);
        }

        $endDateStr = Carbon::parse($application->end_date)->toDateString();
        if (now()->toDateString() < $endDateStr) {
            return $this->errorResponse('Evaluasi akhir baru dapat diberikan setelah periode magang selesai.', 422);
        }

        try {
            $metrics = $this->buildMetrics($intern, $workingDays);
        } catch (Throwable $exception) {
            Log::warning('Evaluasi akhir gagal menghitung metrik peserta.', [
                'intern_id' => $intern->id,
                'message' => $exception->getMessage(),
            ]);

            return $this->errorResponse('Metrik hari kerja belum dapat dihitung. Evaluasi belum disimpan.', 503);
        }

        $skillScores = [
            (float) $validated['score_discipline'],
            (float) $validated['score_quality'],
            (float) $validated['score_initiative'],
            (float) $validated['score_teamwork'],
            (float) $validated['score_softskill'],
        ];
        $allScores = array_merge($skillScores, array_column($technicalScores, 'score'));
        $finalScore = round(array_sum($allScores) / count($allScores), 2);
        $gradeLetter = $this->gradeFor($finalScore);

        $evaluation = DB::transaction(function () use ($application, $mentor, $validated, $metrics, $finalScore, $gradeLetter, $technicalScores): Evaluation {
            $evaluation = Evaluation::updateOrCreate(
                ['intern_application_id' => $application->id],
                [
                    'mentor_id' => $mentor->id,
                    'score_discipline' => $validated['score_discipline'],
                    'score_quality' => $validated['score_quality'],
                    'score_initiative' => $validated['score_initiative'],
                    'score_teamwork' => $validated['score_teamwork'],
                    'score_softskill' => $validated['score_softskill'],
                    'technical_scores' => $technicalScores ?: null,
                    'task_average' => 0,
                    'attendance_percentage' => $metrics['attendance_percentage'],
                    'final_score' => $finalScore,
                    'grade_letter' => $gradeLetter,
                    'notes' => $validated['notes'] ?? null,
                    'remarks' => $validated['notes'] ?? null,
                    'evaluated_at' => now(),
                ],
            );

            $application->update(['internship_status' => 'completed']);

            return $evaluation;
        });

        $evaluation->load(['intern.division', 'mentor', 'internApplication.certificate']);
        $evaluation->setAttribute('evaluation_summary', sprintf(
            'Nilai akhir %s (%s), berdasarkan %d aspek penilaian dengan bobot sama.',
            number_format($finalScore, 2),
            $gradeLetter,
            count($allScores),
        ));
        $evaluation->setAttribute('grade_description', $this->descriptionFor($finalScore));
        $evaluation->setAttribute('education_level', $application->educationLevel());
        $evaluation->setAttribute('metrics', $metrics);

        return $this->successResponse($evaluation, 'Evaluasi akhir berhasil disimpan. Ringkasan nilai tersedia untuk penerbitan sertifikat.', 201);
    }

    private function mentorCanReview(User $mentor, User $intern): bool
    {
        if ($mentor->activeRole() !== 'mentor' || $intern->role !== 'intern') {
            return false;
        }

        if ($mentor->division_id !== null && (int) $mentor->division_id === (int) $intern->division_id) {
            return true;
        }

        return InternApplication::query()
            ->where('user_id', $intern->id)
            ->where('mentor_id', $mentor->id)
            ->exists();
    }

    /** @return array<string, int|float|string> */
    private function buildMetrics(User $intern, EffectiveWorkingDaysCalculator $workingDays): array
    {
        $application = InternApplication::query()
            ->where('user_id', $intern->id)
            ->where('final_status', 'accepted')
            ->latest('id')
            ->first();
        if (! $application) {
            throw new \RuntimeException('Peserta belum memiliki periode magang yang disetujui.');
        }

        $startDate = Carbon::parse($application->start_date)->toDateString();
        $endDate = Carbon::parse($application->end_date)->toDateString();
        $today = now()->toDateString();

        if ($today < $startDate) {
            $workingDates = [];
            $endDateForCalculation = $startDate;
        } else {
            $endDateForCalculation = $endDate < $today ? $endDate : $today;
            $workingDates = $workingDays->getEffectiveWorkingDates($startDate, $endDateForCalculation);
        }

        $totalWorkingDays = count($workingDates);
        $filledDays = $totalWorkingDays === 0 ? 0 : Logbook::query()
            ->where('intern_application_id', $application->id)
            ->whereIn('date', $workingDates)
            ->distinct()
            ->count('date');

        $tasks = Task::query()->where('assigned_to', $intern->id);
        $totalTasks = (clone $tasks)->count();
        $completedTasks = (clone $tasks)->where('status', 'completed')->count();
        $inProgressTasks = (clone $tasks)->where('status', 'in_progress')->count();
        $revisionTasks = (clone $tasks)->where('status', 'revision_needed')->count();
        $taskPercentage = $totalTasks === 0 ? 100 : round(($completedTasks / $totalTasks) * 100, 2);

        $attendanceTotal = $totalWorkingDays === 0 ? 0 : Attendance::query()
            ->where('intern_application_id', $application->id)
            ->whereBetween('date', [$startDate, $endDateForCalculation])
            ->whereIn('date', $workingDates)
            ->whereIn('status', ['present', 'late'])
            ->where('approval_status', 'approved')
            ->count();

        return [
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'in_progress_tasks' => $inProgressTasks,
            'revision_tasks' => $revisionTasks,
            'task_completion_percentage' => $taskPercentage,
            'logbook_completion_percentage' => $totalWorkingDays === 0 ? 0 : round(($filledDays / $totalWorkingDays) * 100, 2),
            'filled_working_days' => $filledDays,
            'total_working_days' => $totalWorkingDays,
            'attendance_percentage' => $totalWorkingDays === 0 ? 0 : round(($attendanceTotal / $totalWorkingDays) * 100, 2),
        ];
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
