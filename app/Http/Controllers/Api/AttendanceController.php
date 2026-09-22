<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AttendanceController extends Controller
{
    use ApiResponse;

    /**
     * List attendance records.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Attendance::with('user')->latest('date');

        if ($user->role === 'intern') {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('month') && $request->filled('year')) {
            $query->whereMonth('date', $request->input('month'))
                ->whereYear('date', $request->input('year'));
        }

        $attendances = $query->paginate($request->input('per_page', 20));

        return $this->successResponse($attendances, 'Daftar presensi berhasil dimuat');
    }

    /**
     * Get current user's today attendance status.
     */
    public function today(Request $request): JsonResponse
    {
        $today = Carbon::today()->toDateString();
        $attendance = Attendance::where('user_id', $request->user()->id)
            ->where('date', $today)
            ->first();

        return $this->successResponse($attendance, 'Status presensi hari ini');
    }

    /**
     * Perform check-in (Intern role).
     */
    public function checkIn(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($existing && $existing->check_in_time) {
            return $this->errorResponse('Anda sudah melakukan check-in hari ini', 422);
        }

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['present', 'late', 'sick', 'leave'])],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('attendances', 'public');
        }

        // Determine status automatically if not manually set to sick/leave
        $status = $validated['status'] ?? null;
        if (! in_array($status, ['sick', 'leave'], true)) {
            // Cutoff time for on-time is 08:15
            $cutoff = Carbon::today()->setHour(8)->setMinute(15)->setSecond(0);
            $status = $now->greaterThan($cutoff) ? 'late' : 'present';
        }

        $attendance = Attendance::updateOrCreate(
            ['user_id' => $user->id, 'date' => $today],
            [
                'check_in_time' => $now->toTimeString(),
                'photo_in' => $photoPath,
                'status' => $status,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return $this->successResponse($attendance, 'Check-in berhasil dicatat', 201);
    }

    /**
     * Perform check-out (Intern role).
     */
    public function checkOut(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if (! $attendance || ! $attendance->check_in_time) {
            return $this->errorResponse('Anda belum melakukan check-in hari ini', 422);
        }

        if ($attendance->check_out_time) {
            return $this->errorResponse('Anda sudah melakukan check-out hari ini', 422);
        }

        $validated = $request->validate([
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('attendances', 'public');
        }

        $attendance->update([
            'check_out_time' => $now->toTimeString(),
            'photo_out' => $photoPath,
            'notes' => $validated['notes'] ?? $attendance->notes,
        ]);

        return $this->successResponse($attendance, 'Check-out berhasil dicatat');
    }
}

