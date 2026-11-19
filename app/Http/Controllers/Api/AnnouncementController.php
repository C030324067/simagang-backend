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

        if (in_array($user->role, ['admin', 'admin_kepegawaian'], true) && $activeRole === $user->role) {
            $divisionId = null;
            $canSeeAll = true;
        } elseif ($user->role === 'kabid' && $activeRole === 'kabid') {
            $divisionId = $user->division_id;
            $canSeeAll = false;
        } elseif ($activeRole === 'mentor') {
            if (! $user->isMentorContext()) {
                return $this->errorResponse('Akun ini tidak memiliki akses pembimbing.', 403);
            }
            $divisionId = $user->division_id;
            $canSeeAll = false;
        } elseif ($activeRole === 'intern') {
            $application = InternApplication::query()
                ->activeInternships()
                ->where('user_id', $user->id)
                ->whereDate('start_date', '<=', now(config('app.timezone'))->toDateString())
                ->latest('id')
                ->first();
            $divisionId = $application?->division_id;
            $canSeeAll = false;
        } else {
            return $this->errorResponse('Anda tidak berhak melihat pengumuman.', 403);
        }

        $announcements = Announcement::query()
            ->with(['mentor:id,name', 'division:id,name'])
            ->where(function ($query) use ($divisionId, $canSeeAll): void {
                if ($canSeeAll || ! $divisionId) {
                    $query->whereNull('division_id');
                } else {
                    $query->where('division_id', $divisionId)->orWhereNull('division_id');
                }
            })
            ->latest()
            ->get();

        return $this->successResponse($announcements, 'Daftar pengumuman bidang berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $this->canManage($user)) {
            return $this->errorResponse('Hanya Kabid atau Admin Kepegawaian yang dapat mengelola pengumuman.', 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'content' => ['required', 'string'],
        ]);

        $announcement = Announcement::query()->create([
            'mentor_id' => $user->id,
            'division_id' => $user->role === 'kabid' ? $user->division_id : null,
            ...$validated,
        ]);

        $announcement->load(['mentor:id,name', 'division:id,name']);

        $activeInterns = $announcement->division_id ? InternApplication::query()
            ->activeInternships()
            ->where('division_id', $announcement->division_id)
            ->whereDate('start_date', '<=', now(config('app.timezone'))->toDateString())
            ->with('user')
            ->get()
            ->pluck('user')
            ->filter()
            ->unique('id') : collect();

        foreach ($activeInterns as $intern) {
            $intern->notify(new AnnouncementPublished($announcement->id, $announcement->title, $announcement->content));
        }

        return $this->successResponse($announcement, 'Pengumuman berhasil diterbitkan.', 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $user = $request->user();
        if (! $this->canManageAnnouncement($user, $announcement)) {
            return $this->errorResponse('Anda tidak berhak mengubah pengumuman ini.', 403);
        }

        $required = $request->isMethod('PUT') ? 'required' : 'sometimes';
        $validated = $request->validate([
            'title' => [$required, 'string', 'max:200'],
            'content' => [$required, 'string'],
        ]);
        $announcement->update($validated);
        $announcement->load(['mentor:id,name', 'division:id,name']);

        return $this->successResponse($announcement, 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        $user = $request->user();
        if (! $this->canManageAnnouncement($user, $announcement)) {
            return $this->errorResponse('Anda tidak berhak menghapus pengumuman ini.', 403);
        }

        $announcement->delete();

        return $this->successResponse(null, 'Pengumuman berhasil dihapus.');
    }

    private function canManage($user): bool
    {
        return ($user->role === 'kabid' && $user->activeRole() === 'kabid' && $user->division_id)
            || (in_array($user->role, ['admin', 'admin_kepegawaian'], true) && $user->activeRole() === $user->role);
    }

    private function canManageAnnouncement($user, Announcement $announcement): bool
    {
        if (! $this->canManage($user)) {
            return false;
        }

        if ($user->role === 'kabid') {
            return (int) $announcement->division_id === (int) $user->division_id;
        }

        return $announcement->division_id === null;
    }
}
