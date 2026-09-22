<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    use ApiResponse;

    /**
     * List evaluations.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Evaluation::with(['intern.division', 'mentor'])->latest();

        if ($user->role === 'intern') {
            $query->where('intern_id', $user->id);
        } elseif ($user->role === 'mentor') {
            $query->where('mentor_id', $user->id);
        }

        $evaluations = $query->paginate($request->input('per_page', 15));

        return $this->successResponse($evaluations, 'Daftar evaluasi dan nilai magang berhasil dimuat');
    }

    /**
     * Show evaluation for a specific intern.
     */
    public function show(User $intern): JsonResponse
    {
        $evaluation = Evaluation::with(['intern.division', 'mentor'])
            ->where('intern_id', $intern->id)
            ->first();

        if (! $evaluation) {
            return $this->errorResponse('Evaluasi untuk pemohon magang ini belum dibuat', 404);
        }

        return $this->successResponse($evaluation, 'Detail evaluasi magang');
    }

    /**
     * Store or update evaluation (Mentor role).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'intern_id' => ['required', 'exists:users,id'],
            'discipline_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'skill_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'softskill_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        // Calculate weighted final score: 30% discipline, 40% technical skill, 30% softskill
        $finalScore = round(
            ($validated['discipline_score'] * 0.30) +
            ($validated['skill_score'] * 0.40) +
            ($validated['softskill_score'] * 0.30),
            2
        );

        $evaluation = Evaluation::updateOrCreate(
            ['intern_id' => $validated['intern_id']],
            [
                'mentor_id' => $request->user()->id,
                'discipline_score' => $validated['discipline_score'],
                'skill_score' => $validated['skill_score'],
                'softskill_score' => $validated['softskill_score'],
                'final_score' => $finalScore,
                'remarks' => $validated['remarks'] ?? null,
            ]
        );

        $evaluation->load(['intern.division', 'mentor']);

        return $this->successResponse($evaluation, 'Penilaian magang berhasil disimpan', 201);
    }
}

