<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\InternApplication;
use App\Notifications\AnnouncementPublished;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeRole = $user->activeRole();

        if ($activeRole === 'mentor') {
            $divisionId = $user->division_id;
        } elseif ($activeRole === 'intern') {
            $application = InternApplication::query()
                ->activeInternships()
                ->where('user_id', $user->id)
                ->whereDate('start_date', '<=', now(config('app.timezone'))->toDateString())
                ->latest('id')
                ->first();
            $divisionId = $application?->division_id;
        } else {
            return $this->errorResponse('Anda tidak berhak melihat pengumuman bidang.', 403);
        }

        if (! $divisionId) {
            return $this->successResponse([], 'Belum ada pengumuman bidang.');
        }

        $announcements = Announcement::query()
            ->with(['mentor:id,name', 'division:id,name'])
            ->where('division_id', $divisionId)
            ->latest()
            ->get();

        return $this->successResponse($announcements, 'Daftar pengumuman bidang berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->activeRole() !== 'mentor') {
            return $this->errorResponse('Hanya mentor dalam mode mentor yang dapat membuat pengumuman.', 403);
        }

        if (! $user->division_id) {
            return $this->errorResponse('Akun mentor belum memiliki bidang. Lengkapi bidang sebelum membuat pengumuman.', 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'content' => ['required', 'string'],
        ]);

        $announcement = Announcement::query()->create([
            'mentor_id' => $user->id,
            'division_id' => $user->division_id,
            ...$validated,
        ]);

        $announcement->load(['mentor:id,name', 'division:id,name']);

        $activeInterns = InternApplication::query()
            ->activeInternships()
            ->where('division_id', $user->division_id)
            ->whereDate('start_date', '<=', now(config('app.timezone'))->toDateString())
            ->with('user')
            ->get()
            ->pluck('user')
            ->filter()
            ->unique('id');

        foreach ($activeInterns as $intern) {
            $intern->notify(new AnnouncementPublished($announcement->id, $announcement->title, $announcement->content));
        }

        return $this->successResponse($announcement, 'Pengumuman berhasil diterbitkan.', 201);
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        $user = $request->user();
        if ($user->activeRole() !== 'mentor') {
            return $this->errorResponse('Hanya mentor dalam mode mentor yang dapat menghapus pengumuman.', 403);
        }

        $isOwner = (int) $announcement->mentor_id === (int) $user->id;
        $isSameDivision = $user->division_id !== null
            && (int) $announcement->division_id === (int) $user->division_id;

        if (! $isOwner && ! $isSameDivision) {
            return $this->errorResponse('Anda tidak berhak menghapus pengumuman bidang lain.', 403);
        }

        $announcement->delete();

        return $this->successResponse(null, 'Pengumuman berhasil dihapus.');
    }
}
