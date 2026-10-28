<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AspekPenilaianSmk;
use App\Models\InternApplication;
use App\Models\PenilaianSmk;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PenilaianSmkController extends Controller
{
    use ApiResponse;

    public function aspects(): JsonResponse
    {
        return $this->successResponse(AspekPenilaianSmk::query()->where('aktif', true)->orderBy('urutan')->get(), 'Aspek penilaian SMK.');
    }

    public function storeAspect(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'urutan' => ['sometimes', 'integer', 'min:0'],
            'aktif' => ['sometimes', 'boolean'],
        ]);
        $validated['dibuat_oleh'] = $request->user()->id;

        return $this->successResponse(AspekPenilaianSmk::create($validated), 'Aspek penilaian berhasil dibuat.', 201);
    }

    public function updateAspect(Request $request, AspekPenilaianSmk $aspect): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'urutan' => ['sometimes', 'integer', 'min:0'],
            'aktif' => ['sometimes', 'boolean'],
        ]);
        $oldName = $aspect->nama;
        $newName = $validated['nama'] ?? $oldName;
        DB::transaction(function () use ($aspect, $validated, $oldName, $newName): void {
            $aspect->update($validated);
            if ($oldName !== $newName) {
                foreach (PenilaianSmk::query()->where('aspek', $oldName)->get() as $score) {
                    $existing = PenilaianSmk::query()
                        ->where('intern_application_id', $score->intern_application_id)
                        ->where('aspek', $newName)
                        ->first();
                    if ($existing) {
                        $score->delete();
                    } else {
                        $score->update(['aspek' => $newName]);
                    }
                }
            }
        });

        return $this->successResponse($aspect->refresh(), 'Aspek penilaian berhasil diperbarui.');
    }

    public function destroyAspect(AspekPenilaianSmk $aspect): JsonResponse
    {
        $aspect->delete();

        return $this->successResponse(null, 'Aspek penilaian berhasil dihapus.');
    }

    public function scores(Request $request, InternApplication $application): JsonResponse
    {
        abort_unless($this->canManage($request, $application), 403);

        return $this->successResponse($application->penilaianSmk()->orderBy('aspek')->get(), 'Penilaian peserta SMK.');
    }

    public function saveScores(Request $request, InternApplication $application): JsonResponse
    {
        abort_unless($this->canManage($request, $application), 403);
        $validated = $request->validate([
            'nilai' => ['required', 'array', 'min:1'],
            'nilai.*.aspek' => ['required', 'string', 'max:255'],
            'nilai.*.nilai' => ['required', 'numeric', 'min:0', 'max:100'],
            'nilai.*.catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        foreach ($validated['nilai'] as $score) {
            abort_unless(AspekPenilaianSmk::query()->where('nama', $score['aspek'])->where('aktif', true)->exists(), 422, 'Aspek penilaian tidak valid.');
            PenilaianSmk::updateOrCreate(
                ['intern_application_id' => $application->id, 'aspek' => $score['aspek']],
                ['nilai' => $score['nilai'], 'catatan' => $score['catatan'] ?? null, 'dinilai_oleh' => $request->user()->id],
            );
        }

        return $this->successResponse($application->penilaianSmk()->orderBy('aspek')->get(), 'Penilaian SMK berhasil disimpan.');
    }

    private function canManage(Request $request, InternApplication $application): bool
    {
        $user = $request->user();

        return in_array($user->role, ['admin_kepegawaian', 'mentor'], true)
            && ($user->role === 'admin_kepegawaian' || (int) $user->division_id === (int) $application->division_id);
    }
}
