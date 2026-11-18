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
                'user:id,name',
                'division:id,name',
                'evaluation:intern_application_id,attendance_percentage,final_score,grade_letter',
            ])
            ->get();

        $accepted = $applications->filter(fn (InternApplication $application): bool => $application->final_status === 'accepted');
        $evaluations = $applications->pluck('evaluation')->filter();
        $divisionApplications = $applications->groupBy(fn (InternApplication $application): ?int => $application->division_id);

        $divisions = Division::query()
            ->when(
                isset($filters['division_id']),
                fn (Builder $query) => $query->whereKey($filters['division_id']),
            )
            ->orderBy('name')
            ->get(['id', 'name', 'quota'])
            ->map(function (Division $division) use ($divisionApplications): array {
                /** @var Collection<int, InternApplication> $items */
                $items = $divisionApplications->get($division->id, collect());
                $accepted = $items->filter(fn (InternApplication $application): bool => $application->final_status === 'accepted');

                return [
                    'division_id' => $division->id,
                    'division_name' => $division->name,
                    'quota' => $division->quota,
                    'total_applicants' => $items->count(),
                    'total_accepted' => $accepted->count(),
                    'total_active' => $accepted->where('internship_status', 'in_progress')->count(),
                    'total_completed' => $accepted->where('internship_status', 'completed')->count(),
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
                'total_active' => $accepted->where('internship_status', 'in_progress')->count(),
                'total_completed' => $accepted->where('internship_status', 'completed')->count(),
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
                'final_status' => $application->final_status,
                'attendance_percentage' => $application->evaluation?->attendance_percentage,
                'final_score' => $application->evaluation?->final_score,
                'grade_letter' => $application->evaluation?->grade_letter,
            ])->values(),
        ];
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
