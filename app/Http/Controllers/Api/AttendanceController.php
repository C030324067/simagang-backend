<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\InternApplication;
use App\Models\User;
use App\Services\EffectiveWorkingDaysCalculator;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

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
        } elseif ($user->role === 'mentor') {
            abort_unless($user->division_id, 403, 'Akun mentor belum terhubung dengan divisi.');
            $query->whereHas('user', fn ($userQuery) => $userQuery->where('division_id', $user->division_id));
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
     * Return effective-working-day attendance totals for the current intern or a mentor's intern.
     */
    public function summary(Request $request, EffectiveWorkingDaysCalculator $workingDays): JsonResponse
    {
        $actor = $request->user();
        $internId = $actor->role === 'intern' ? $actor->id : $request->integer('user_id');

        if (! $internId) {
            return $this->errorResponse('Pilih peserta magang untuk melihat ringkasan kehadiran.', 422);
        }

        $intern = User::query()->where('role', 'intern')->find($internId);
        if (! $intern) {
            return $this->errorResponse('Peserta magang tidak ditemukan.', 404);
        }

        if ($actor->role === 'mentor' && (! $actor->division_id || (int) $intern->division_id !== (int) $actor->division_id)) {
            return $this->errorResponse('Anda tidak berhak melihat kehadiran peserta dari bidang lain.', 403);
        }

        $application = InternApplication::query()
            ->where('user_id', $intern->id)
            ->where('final_status', 'accepted')
            ->latest('id')
            ->first();

        if (! $application) {
            return $this->successResponse([
                'total_hadir' => 0,
                'total_hari_kerja_efektif' => 0,
                'attendance_percentage' => 0,
            ], 'Peserta belum memiliki periode magang aktif.');
        }

        try {
            $workingDates = $workingDays->getEffectiveWorkingDates($application->start_date, $application->end_date);
        } catch (Throwable $exception) {
            Log::error('Ringkasan kehadiran gagal menghitung hari kerja efektif.', [
                'intern_id' => $intern->id,
                'message' => $exception->getMessage(),
            ]);

            return $this->errorResponse('Data hari kerja dan hari libur belum dapat dimuat. Periksa konfigurasi Google Calendar API.', 503);
        }

        $totalHadir = count($workingDates) === 0 ? 0 : Attendance::query()
            ->where('user_id', $intern->id)
            ->whereBetween('date', [$application->start_date, $application->end_date])
            ->whereIn('date', $workingDates)
            ->whereIn('status', ['present', 'late'])
            ->where('approval_status', 'approved')
            ->count();
        $effectiveDays = count($workingDates);

        return $this->successResponse([
            'total_hadir' => $totalHadir,
            'total_hari_kerja_efektif' => $effectiveDays,
            'attendance_percentage' => $effectiveDays === 0 ? 0 : round(($totalHadir / $effectiveDays) * 100, 2),
            'start_date' => Carbon::parse($application->start_date)->toDateString(),
            'end_date' => Carbon::parse($application->end_date)->toDateString(),
        ], 'Ringkasan kehadiran berhasil dihitung.');
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
        $now = now();

        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($existing) {
            return $this->errorResponse('Anda sudah mengirim presensi hari ini.', 422);
        }

        $status = $request->input('status');
        $validated = $request->validate([
            'status' => ['required', Rule::in(['present', 'sick', 'leave'])],
            'photo' => [Rule::requiredIf($status === 'present'), 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'latitude' => [Rule::requiredIf($status === 'present'), 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => [Rule::requiredIf($status === 'present'), 'nullable', 'numeric', 'between:-180,180'],
            'dokumen_skd' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg', 'max:5120'],
            'dokumen_izin' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg', 'max:5120'],
            'notes' => [Rule::requiredIf(in_array($status, ['sick', 'leave'], true)), 'nullable', 'string', 'max:500'],
        ]);

        $officeLatitude = config('attendance.office_lat');
        $officeLongitude = config('attendance.office_lng');
        $latitude = isset($validated['latitude']) ? (float) $validated['latitude'] : null;
        $longitude = isset($validated['longitude']) ? (float) $validated['longitude'] : null;
        $withinRadius = null;
        if ($status === 'present') {
            if (! is_numeric($officeLatitude) || ! is_numeric($officeLongitude)) {
                return $this->errorResponse('Lokasi kantor belum dikonfigurasi. Presensi hadir belum dapat dilakukan.', 503);
            }

            $location = new Attendance(['latitude' => $latitude, 'longitude' => $longitude]);
            $distance = $location->distanceTo((float) $officeLatitude, (float) $officeLongitude);
            $withinRadius = $distance !== null && $distance <= config('attendance.max_radius_meters', 50);
            if (! $withinRadius) {
                return $this->errorResponse('Presensi hadir hanya dapat dikirim dari area kantor (maksimal '.config('attendance.max_radius_meters', 50).' meter).', 422);
            }
        }

        $selfiePath = $request->file('photo')?->store('attendances/selfies', 'public');
        $attachment = $status === 'sick' ? $request->file('dokumen_skd') : ($status === 'leave' ? $request->file('dokumen_izin') : null);
        $attachmentPath = $attachment?->store('attendances/attachments', 'public');
        $cutoff = $now->copy()->startOfDay()->setTime(8, 15);
        $recordStatus = $status === 'present' && $now->greaterThan($cutoff) ? 'late' : $status;

        try {
            $attendance = Attendance::create([
                'user_id' => $user->id,
                'date' => $today,
                'check_in_time' => $now->format('H:i:s'),
                'clock_in_at' => $now,
                'photo_in' => $selfiePath,
                'selfie_path' => $selfiePath,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'is_within_radius' => $withinRadius,
                'attachment_path' => $attachmentPath,
                'status' => $recordStatus,
                'approval_status' => 'pending_approval',
                'notes' => $validated['notes'] ?? null,
            ]);
        } catch (Throwable $exception) {
            if ($selfiePath) {
                Storage::disk('public')->delete($selfiePath);
            }
            if ($attachmentPath) {
                Storage::disk('public')->delete($attachmentPath);
            }
            throw $exception;
        }

        return $this->successResponse($attendance, 'Presensi terkirim dan menunggu persetujuan mentor.', 201);
    }

    /**
     * Perform check-out (Intern role).
     */
    public function checkOut(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $now = now();

        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if (! $attendance || ! $attendance->check_in_time) {
            return $this->errorResponse('Anda belum melakukan check-in hari ini', 422);
        }

        if ($attendance->check_out_time) {
            return $this->errorResponse('Anda sudah melakukan check-out hari ini', 422);
        }

        $attendance->update([
            'check_out_time' => $now->format('H:i:s'),
            'clock_out_at' => $now,
        ]);

        return $this->successResponse($attendance, 'Check-out berhasil dicatat');
    }

    public function pendingApprovals(Request $request): JsonResponse
    {
        $mentor = $request->user();
        abort_unless($mentor->division_id, 403, 'Akun mentor belum terhubung dengan divisi.');

        $attendances = Attendance::query()
            ->with('user:id,name,email,division_id')
            ->where('approval_status', 'pending_approval')
            ->whereHas('user', fn ($query) => $query->where('division_id', $mentor->division_id))
            ->latest('date')
            ->latest('id')
            ->get();

        $officeLatitude = config('attendance.office_lat');
        $officeLongitude = config('attendance.office_lng');
        $attendances->each(function (Attendance $attendance) use ($officeLatitude, $officeLongitude): void {
            $attendance->setAttribute(
                'distance_meters',
                is_numeric($officeLatitude) && is_numeric($officeLongitude)
                    ? $attendance->distanceTo((float) $officeLatitude, (float) $officeLongitude)
                    : null,
            );
        });

        return $this->successResponse($attendances, 'Antrean persetujuan presensi berhasil dimuat.');
    }

    public function review(Request $request, Attendance $attendance): JsonResponse
    {
        $mentor = $request->user();
        abort_unless($mentor->division_id, 403, 'Akun mentor belum terhubung dengan divisi.');
        abort_unless((int) $attendance->user()->value('division_id') === (int) $mentor->division_id, 404);

        $validated = $request->validate([
            'approval_status' => ['required', Rule::in(['approved', 'rejected'])],
            'rejection_reason' => ['required_if:approval_status,rejected', 'nullable', 'string', 'max:2000'],
        ]);

        if ($attendance->approval_status !== 'pending_approval') {
            return $this->errorResponse('Presensi ini sudah ditinjau sebelumnya.', 422);
        }

        DB::transaction(function () use ($attendance, $validated): void {
            $lockedAttendance = Attendance::query()->lockForUpdate()->findOrFail($attendance->id);
            if ($lockedAttendance->approval_status !== 'pending_approval') {
                abort(409, 'Presensi sudah ditinjau oleh mentor lain. Muat ulang antrean.');
            }

            $lockedAttendance->update([
                'approval_status' => $validated['approval_status'],
                'rejection_reason' => $validated['approval_status'] === 'rejected' ? $validated['rejection_reason'] : null,
            ]);
        });

        return $this->successResponse($attendance->fresh('user'), 'Keputusan presensi berhasil disimpan.');
    }

    public function file(Request $request, Attendance $attendance, string $kind): StreamedResponse
    {
        $mentor = $request->user();
        abort_unless($mentor->division_id, 403, 'Akun mentor belum terhubung dengan divisi.');
        abort_unless((int) $attendance->user()->value('division_id') === (int) $mentor->division_id, 404);

        $path = match ($kind) {
            'selfie' => $attendance->selfie_path ?: $attendance->photo_in,
            'attachment' => $attendance->attachment_path,
            default => null,
        };

        abort_unless($path && Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->download($path, basename($path));
    }
}
