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
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class RegisterApplicationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'application_type' => ['required', Rule::in(['mandiri', 'rekomendasi_kampus'])],
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
            'recommendation_letter_number' => [
                Rule::requiredIf($request->input('application_type') === 'rekomendasi_kampus'),
                'nullable',
                'string',
                'max:255',
            ],
            'b1' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'b2' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'b3' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'b4' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        $divisionCode = match ($validated['bidang']) {
            'Aptika' => 'aptika',
            'Statistika' => 'statistik',
            'IKP' => 'ikp',
        };
        $division = Division::query()
            ->whereRaw('LOWER(code) = ?', [$divisionCode])
            ->first();

        if (! $division) {
            return response()->json([
                'message' => 'Bidang yang dipilih belum tersedia untuk pendaftaran.',
                'errors' => ['bidang' => ['Silakan pilih bidang yang tersedia atau hubungi administrator.']],
            ], 422);
        }

        $stored = [];
        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $validated['nama'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['pw']),
                'role' => 'applicant',
                'status_akun' => 'pending',
                'no_hp' => $validated['hp'],
                'division_id' => $division?->id,
            ]);

            foreach (['b1', 'b2', 'b3', 'b4'] as $key) {
                $stored[$key] = $request->file($key)->store('documents', 'public');
            }

            $trackingCode = 'TRK-'.Str::upper(Str::random(12));
            $application = InternApplication::create([
                'user_id' => $user->id,
                'application_type' => $validated['application_type'],
                'institution_name' => $validated['institusi'],
                'recommendation_letter_number' => $validated['recommendation_letter_number'] ?? null,
                'major' => $validated['jurusan'],
                'file_proposal' => $stored['b1'],
                'cover_letter_path' => $stored['b1'],
                'file_cv' => $stored['b2'],
                'file_recommendation_letter' => $validated['application_type'] === 'rekomendasi_kampus' ? $stored['b3'] : null,
                'transcript_path' => $validated['application_type'] === 'mandiri' ? $stored['b3'] : null,
                'student_card_path' => $stored['b4'],
                'status' => 'pending_kepegawaian',
                'start_date' => $validated['tgl_mulai'],
                'end_date' => $validated['tgl_selesai'],
                'division_id' => $division?->id,
                'tracking_code' => $trackingCode,
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pendaftaran berhasil! Berkas Anda sedang ditinjau oleh pihak Diskominfo. Akun Anda akan diaktifkan setelah pendaftaran DITERIMA.',
                'redirect_url' => url('/login'),
                'tracking_code' => $trackingCode,
                'data' => ['tracking_code' => $trackingCode, 'status' => $application->status],
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
