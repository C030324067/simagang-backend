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
        $now = now();
        $year = (int) $now->year;
        $month = (int) $now->month;
        $quarter = (int) ceil($month / 3);
        $periods = InternshipPeriod::query()
            ->where('year', $year)
            ->where('month', $month)
            ->get()
            ->keyBy('division_id');

        $divisions = Division::query()
            ->orderBy('name')
            ->get()
            ->map(function (Division $division) use ($periods, $year, $month): array {
                $period = $periods->get($division->id);
                $applicationsCount = $period?->applicationsCount() ?? InternApplication::query()
                    ->where('division_id', $division->id)
                    ->whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->count();

                return [
                    'id' => $division->id,
                    'name' => $division->name,
                    'code' => $division->code,
                    'configured' => $period !== null,
                    'monthly_quota' => $period?->monthly_quota,
                    'registered_count' => $applicationsCount,
                    'remaining_quota' => $period ? max(0, $period->monthly_quota - $applicationsCount) : null,
                    'is_closed' => $period?->isClosed($applicationsCount) ?? false,
                    'can_register' => $period !== null && ! $period->isClosed($applicationsCount),
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
