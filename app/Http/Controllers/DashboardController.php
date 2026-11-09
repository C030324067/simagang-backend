<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\InternApplication;
use App\Models\Logbook;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $activeRole = $user->activeRole();

        abort_unless($activeRole, 403, 'Tidak ada konteks peran aktif.');

        if ($activeRole === 'kabid') {
            abort_unless($user->division_id, 403, 'Akun Kabid belum memiliki bidang.');

            $applications = InternApplication::query()
                ->where('division_id', $user->division_id)
                ->latest()
                ->get();

            return view('dashboard.kabid', [
                'applications' => $applications,
                'totalApplications' => $applications->count(),
                'pendingApplications' => $applications->where('status_kabid', 'pending')->count(),
            ]);
        }

        $applications = InternApplication::query()
            ->where('mentor_id', $user->id)
            ->where('final_status', 'accepted')
            ->with('user')
            ->latest()
            ->get();
        $applicationIds = $applications->modelKeys();

        return view('dashboard.mentor', [
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
        ]);
    }
}
