<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class DivisionController extends Controller
{
    use ApiResponse;

    /**
     * List all available divisions with dynamic SSOT remaining quota calculations.
     */
    public function index(): JsonResponse
    {
        $divisions = Division::query()
            ->withCount('activeApplications')
            ->with('activeKabid:id,name,position,division_id')
            ->get();

        $divisions->each(function (Division $division): void {
            $division->setAttribute(
                'remaining_quota',
                $division->remainingQuota($division->active_applications_count),
            );
        });

        return $this->successResponse($divisions, 'Daftar bidang/divisi berhasil diambil');
    }
}
