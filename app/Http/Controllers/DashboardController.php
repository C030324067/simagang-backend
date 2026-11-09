<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\InternApplication;
use App\Models\Logbook;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): View|JsonResponse
    {
        $user = $request->user();
        $activeRole = $user->activeRole();

        abort_unless(
            in_array($activeRole, ['kabid', 'mentor'], true) && $user->hasRole($activeRole),
            403,
            'Tidak ada konteks peran aktif yang valid.',
        );

        if ($activeRole === 'kabid') {
            abort_unless($user->division_id, 403, 'Akun Kabid belum memiliki bidang.');

            $applications = InternApplication::query()
                ->where('division_id', $user->division_id)
                ->latest()
                ->get();

            $dashboardData = [
                'active_role' => 'kabid',
                'applications' => $applications,
                'totalApplications' => $applications->count(),
                'pendingApplications' => $applications->where('status_kabid', 'pending')->count(),
            ];

            if ($request->wantsJson()) {
                return response()->json($dashboardData);
            }

            return view('dashboard.kabid', $dashboardData);
        }

        $applications = InternApplication::query()
            ->where('mentor_id', $user->id)
            ->where('final_status', 'accepted')
            ->with('user')
            ->latest()
            ->get();
        $applicationIds = $applications->modelKeys();

        $dashboardData = [
            'active_role' => 'mentor',
            'applications' => $applications,
            'pendingAttendances' => Attendance::query()
                ->whereIn('intern_application_id', $applicationIds)
                ->where('approval_status', 'pending_approval')
                ->with('internApplication.user')
                ->latest('date')
                ->get(),
            'pendingLogbooks' => Logbook::query()
                ->whereIn('intern_application_id', $applicationIds)
                ->where('verification_status', 'pending')
                ->with('internApplication.user')
                ->latest('date')
                ->get(),
        ];

        if ($request->wantsJson()) {
            return response()->json($dashboardData);
        }

        return view('dashboard.mentor', $dashboardData);
    }
}
