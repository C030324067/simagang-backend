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
     * List all available divisions.
     */
    public function index(): JsonResponse
    {
        $divisions = Division::query()
            ->withCount('applications', 'activeInterns')
            ->get();

        $divisions->each(function (Division $division): void {
            $division->setAttribute(
                'remaining_quota',
                $division->remainingQuota($division->active_interns_count),
            );
        });

        return $this->successResponse($divisions, 'Daftar bidang/divisi berhasil diambil');
    }
}
