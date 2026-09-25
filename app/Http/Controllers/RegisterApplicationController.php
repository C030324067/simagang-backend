<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Throwable;

class RegisterApplicationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'bidang' => ['required', Rule::in(['Aptika', 'Statistika', 'IKP'])],
            'institusi' => ['required', 'string', 'max:255'],
            'jurusan' => ['required', 'string', 'max:255'],
            'hp' => ['required', 'string', 'max:30'],
            'tgl_mulai' => ['required', 'date', 'after_or_equal:today'],
            'tgl_selesai' => ['required', 'date', 'after_or_equal:tgl_mulai'],
            'pw' => ['required', 'string', 'min:8', 'same:pw2'],
            'pw2' => ['required', 'string'],
            'b1' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'b2' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'b3' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'b4' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        $stored = [];
        DB::beginTransaction();
        try {
            // Resolve the selected division without assuming seeded database IDs.
            $division = Division::where('code', $validated['bidang'])
                ->orWhere('name', 'like', '%'.$validated['bidang'].'%')->first();

            $user = User::create([
                'name' => $validated['nama'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['pw']),
                'role' => 'intern',
                'no_hp' => $validated['hp'],
                'division_id' => $division?->id,
            ]);

            foreach (['b1', 'b2', 'b3', 'b4'] as $key) {
                $stored[$key] = $request->file($key)->store('documents', 'public');
            }

            InternApplication::create([
                'user_id' => $user->id,
                'application_type' => 'mandiri',
                'institution_name' => $validated['institusi'],
                'major' => $validated['jurusan'],
                'file_proposal' => $stored['b1'],
                'cover_letter_path' => $stored['b1'],
                'file_cv' => $stored['b2'],
                'file_recommendation_letter' => $stored['b3'],
                'transcript_path' => $stored['b3'],
                'student_card_path' => $stored['b4'],
                'status' => 'pending_kepegawaian',
                'start_date' => $validated['tgl_mulai'],
                'end_date' => $validated['tgl_selesai'],
                'division_id' => $division?->id,
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pendaftaran berhasil. Silakan masuk menggunakan akun Anda.',
                'redirect_url' => url('/login'),
            ], 201);
        } catch (Throwable $exception) {
            DB::rollBack();
            foreach ($stored as $path) {
                Storage::disk('public')->delete($path);
            }
            report($exception);

            return response()->json(['status' => 'error', 'message' => 'Pendaftaran gagal diproses. Silakan coba lagi.'], 500);
        }
    }
}
