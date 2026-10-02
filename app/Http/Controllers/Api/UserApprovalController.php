<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class UserApprovalController extends Controller
{
    use ApiResponse;

    /**
     * Approve an applicant and activate their intern account.
     */
    public function approve(User $user): JsonResponse
    {
        if ($user->role !== 'applicant' || $user->status_akun !== 'pending') {
            return $this->errorResponse('Hanya akun pemohon yang masih menunggu verifikasi yang dapat disetujui.', 422);
        }

        $user->update([
            'status_akun' => 'approved',
            'role' => 'intern',
            'tanggal_disetujui' => now(),
        ]);

        return $this->successResponse($user->fresh(), 'Akun pemohon berhasil disetujui dan diaktifkan.');
    }
}
