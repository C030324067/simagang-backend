<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\InternApplication;
use App\Models\InternshipPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InternshipPeriodController extends Controller
{
    public function currentStatus(): JsonResponse
    {
        $now = now(config('app.timezone'));
        $year = (int) $now->year;
        $month = (int) $now->month;
        $quarter = (int) ceil($month / 3);
        $periods = InternshipPeriod::query()
            ->where('year', $year)
            ->where('month', $month)
            ->get()
            ->keyBy('division_id');

        $divisions = Division::query()
            ->withCount('activeApplications')
            ->orderBy('name')
            ->get()
            ->map(function (Division $division) use ($periods, $now): array {
                $period = $periods->get($division->id);
                $applicationsCount = $period?->applicationsCount() ?? InternApplication::query()
                    ->where('division_id', $division->id)
                    ->where('created_at', '>=', $now->copy()->startOfMonth())
                    ->where('created_at', '<', $now->copy()->startOfMonth()->addMonth())
                    ->count();
                $status = $period?->registrationStatus($now, $applicationsCount) ?? 'not_configured';
                $divisionRemainingQuota = $division->remainingQuota($division->active_applications_count);

                if ($status === 'open' && $divisionRemainingQuota <= 0) {
                    $status = 'division_full';
                }

                return [
                    'id' => $division->id,
                    'name' => $division->name,
                    'code' => $division->code,
                    'configured' => $period !== null,
                    'monthly_quota' => $period?->monthly_quota,
                    'start_date' => $period?->start_date?->format('Y-m-d'),
                    'end_date' => $period?->end_date?->format('Y-m-d'),
                    'is_active' => $period?->is_active ?? false,
                    'registered_count' => $applicationsCount,
                    'remaining_quota' => $period ? max(0, $period->monthly_quota - $applicationsCount) : null,
                    'is_closed' => $period?->isClosed($applicationsCount) ?? false,
                    'division_remaining_quota' => $divisionRemainingQuota,
                    'availability_status' => $status,
                    'can_register' => $status === 'open',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'year' => $year,
                'month' => $month,
                'quarter' => $quarter,
                'period_label' => $now->locale('id')->translatedFormat('F Y').' (Triwulan '.$quarter.')',
                'divisions' => $divisions,
            ],
        ]);
    }

    public function index(): JsonResponse
    {
        $periods = InternshipPeriod::query()
            ->with('division:id,name,code')
            ->orderByDesc('year')
            ->orderBy('month')
            ->orderBy('division_id')
            ->get()
            ->map(fn (InternshipPeriod $period): array => [
                ...$period->toArray(),
                'registered_count' => $period->applicationsCount(),
                'is_closed' => $period->isClosed(),
                'availability_status' => $period->registrationStatus(),
            ]);

        return response()->json(['success' => true, 'data' => $periods]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'division_id' => ['required', 'integer', Rule::exists('divisions', 'id')],
            'year' => ['required', 'integer', 'between:2000,2100'],
            'quarter' => ['required', 'integer', 'between:1,4'],
            'month' => ['required', 'integer', 'between:1,12'],
            'monthly_quota' => ['required', 'integer', 'min:0', 'max:100000'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'is_active' => ['required', 'boolean'],
        ]);
        $validator->after(function ($validator) use ($request): void {
            if (
                is_numeric($request->input('quarter'))
                && is_numeric($request->input('month'))
                && (int) $request->input('quarter') !== (int) ceil((int) $request->input('month') / 3)
            ) {
                $validator->errors()->add('quarter', 'Triwulan tidak sesuai dengan bulan yang dipilih.');
            }
        });

        $validated = $validator->validate();
        $period = InternshipPeriod::query()->updateOrCreate(
            [
                'division_id' => $validated['division_id'],
                'year' => $validated['year'],
                'month' => $validated['month'],
            ],
            [
                'quarter' => $validated['quarter'],
                'monthly_quota' => $validated['monthly_quota'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'is_active' => $validated['is_active'],
            ],
        );

        return response()->json([
            'success' => true,
            'message' => 'Kuota periode magang berhasil disimpan.',
            'data' => $period->load('division:id,name,code'),
        ]);
    }

    public function destroy(InternshipPeriod $internshipPeriod): JsonResponse
    {
        $internshipPeriod->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan kuota periode berhasil dihapus.',
        ]);
    }
}
