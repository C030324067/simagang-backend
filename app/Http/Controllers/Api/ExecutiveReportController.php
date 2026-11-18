<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Services\ExecutiveReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class ExecutiveReportController extends Controller
{
    public function __construct(private readonly ExecutiveReportService $reportService) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'data' => $this->reportService->generate($filters),
        ]);
    }

    public function exportPdf(Request $request): Response
    {
        $filters = $this->validatedFilters($request);
        $report = $this->reportService->generate($filters);
        $divisionName = isset($filters['division_id'])
            ? Division::query()->whereKey($filters['division_id'])->value('name')
            : null;

        $startDate = isset($filters['start_date'])
            ? Carbon::createFromFormat('Y-m-d', $filters['start_date'])->locale('id')->translatedFormat('d F Y')
            : null;
        $endDate = isset($filters['end_date'])
            ? Carbon::createFromFormat('Y-m-d', $filters['end_date'])->locale('id')->translatedFormat('d F Y')
            : null;
        $periodLabel = match (true) {
            $startDate !== null && $endDate !== null => "Periode: {$startDate} s.d. {$endDate}",
            $startDate !== null => "Periode: Mulai {$startDate}",
            $endDate !== null => "Periode: Sampai {$endDate}",
            default => 'Periode: Semua Periode',
        };

        return Pdf::loadView('pdf.executive-report', [
            'report' => $report,
            'divisionName' => $divisionName,
            'periodLabel' => $periodLabel,
        ])
            ->setPaper('a4', 'portrait')
            ->download('laporan-eksekutif-magang-'.now()->format('Ymd').'.pdf');
    }

    /**
     * @return array{division_id?: int, start_date?: string, end_date?: string}
     */
    private function validatedFilters(Request $request): array
    {
        $filters = $request->validate([
            'division_id' => ['sometimes', 'nullable', 'integer', 'exists:divisions,id'],
            'start_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
        ]);

        if (isset($filters['start_date'], $filters['end_date'])
            && $filters['end_date'] < $filters['start_date']) {
            throw ValidationException::withMessages([
                'end_date' => 'Tanggal akhir harus sama dengan atau setelah tanggal mulai.',
            ]);
        }

        return array_filter($filters, fn ($value): bool => $value !== null);
    }
}
