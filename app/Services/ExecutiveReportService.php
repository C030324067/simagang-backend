<?php

namespace App\Services;

use App\Models\Division;
use App\Models\InternApplication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ExecutiveReportService
{
    /**
     * Build the data shared by the JSON and PDF reports.
     *
     * @param  array{division_id?: int, start_date?: string, end_date?: string}  $filters
     * @return array<string, mixed>
     */
    public function generate(array $filters): array
    {
        $applications = $this->applicationsQuery($filters)
            ->with([
                'user:id,name,role,status_akun,is_active',
                'user.internApplication',
                'division:id,name',
                'evaluation:intern_application_id,attendance_percentage,final_score,grade_letter',
                'certificate',
            ])
            ->get();

        $accepted = $applications->filter(fn (InternApplication $application): bool => $application->final_status === 'accepted');
        $activeApplicationIds = array_fill_keys(
            InternApplication::query()
                ->activeInternships()
                ->whereIn('id', $applications->modelKeys())
                ->pluck('id')
                ->all(),
            true,
        );
        $today = now(config('app.timezone'))->toDateString();
        $completed = $accepted->filter(fn (InternApplication $application): bool => $this->isCompleted($application, $today));
        $evaluations = $applications->pluck('evaluation')->filter();
        $divisionApplications = $applications->groupBy(fn (InternApplication $application): ?int => $application->division_id);

        $divisions = Division::query()
            ->when(
                isset($filters['division_id']),
                fn (Builder $query) => $query->whereKey($filters['division_id']),
            )
            ->orderBy('name')
            ->get(['id', 'name', 'quota'])
            ->map(function (Division $division) use ($divisionApplications, $activeApplicationIds, $today): array {
                /** @var Collection<int, InternApplication> $items */
                $items = $divisionApplications->get($division->id, collect());
                $accepted = $items->filter(fn (InternApplication $application): bool => $application->final_status === 'accepted');

                return [
                    'division_id' => $division->id,
                    'division_name' => $division->name,
                    'quota' => $division->quota,
                    'total_applicants' => $items->count(),
                    'total_accepted' => $accepted->count(),
                    'total_active' => $accepted->filter(fn (InternApplication $application): bool => isset($activeApplicationIds[$application->id]))->count(),
                    'total_completed' => $accepted->filter(fn (InternApplication $application): bool => $this->isCompleted($application, $today))->count(),
                    'average_final_score' => $accepted->pluck('evaluation.final_score')
                        ->filter(fn ($score): bool => $score !== null)
                        ->avg(),
                ];
            })
            ->values();

        return [
            'generated_at' => now(config('app.timezone'))->toIso8601String(),
            'filters' => [
                'division_id' => $filters['division_id'] ?? null,
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
            ],
            'summary' => [
                'total_applicants' => $applications->count(),
                'total_accepted' => $accepted->count(),
                'total_active' => $accepted->filter(fn (InternApplication $application): bool => isset($activeApplicationIds[$application->id]))->count(),
                'total_completed' => $completed->count(),
                'average_attendance_percentage' => $evaluations
                    ->pluck('attendance_percentage')
                    ->filter(fn ($percentage): bool => $percentage !== null)
                    ->avg(),
            ],
            'divisions' => $divisions,
            'participants' => $applications->map(fn (InternApplication $application): array => [
                'application_id' => $application->id,
                'participant_name' => $application->user?->name,
                'institution_name' => $application->institution_name,
                'major' => $application->major,
                'division_name' => $application->division?->name,
                'start_date' => $application->start_date?->toDateString(),
                'end_date' => $application->end_date?->toDateString(),
                'internship_status' => $application->internship_status,
                'participant_status' => $this->participantStatus($application, $activeApplicationIds, $today),
                'final_status' => $application->final_status,
                'attendance_percentage' => $application->evaluation?->attendance_percentage,
                'final_score' => $application->evaluation?->final_score,
                'grade_letter' => $application->evaluation?->grade_letter,
            ])->values(),
        ];
    }

    private function isCompleted(InternApplication $application, string $today): bool
    {
        return in_array($application->internship_status, ['completed', 'selesai'], true)
            || $application->certificate !== null
            || ($application->end_date !== null && $application->end_date->toDateString() < $today);
    }

    /**
     * @param  array<int|string, true>  $activeApplicationIds
     */
    private function participantStatus(InternApplication $application, array $activeApplicationIds, string $today): string
    {
        if ($application->final_status === 'rejected' || in_array($application->internship_status, ['rejected', 'ditolak'], true)) {
            return 'rejected';
        }

        if ($application->user?->isExpired() || in_array($application->internship_status, ['expired', 'kedaluwarsa'], true)) {
            return 'expired';
        }

        if ($this->isCompleted($application, $today)) {
            return 'completed';
        }

        if (isset($activeApplicationIds[$application->id])) {
            return 'active';
        }

        return 'pending';
    }

    /**
     * @param  array{division_id?: int, start_date?: string, end_date?: string}  $filters
     */
    private function applicationsQuery(array $filters): Builder
    {
        return InternApplication::query()
            ->when(
                isset($filters['division_id']),
                fn (Builder $query) => $query->where('division_id', $filters['division_id']),
            )
            ->when(
                isset($filters['start_date']),
                fn (Builder $query) => $query->whereDate('end_date', '>=', $filters['start_date']),
            )
            ->when(
                isset($filters['end_date']),
                fn (Builder $query) => $query->whereDate('start_date', '<=', $filters['end_date']),
            )
            ->orderBy('start_date')
            ->orderBy('id');
    }
}
