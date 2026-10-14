<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\InternshipPeriod;
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
        $divisionCodes = Division::query()->pluck('code')->all();
        $legacyDivisionCodes = ['Aptika', 'Statistika', 'IKP'];

        $validated = $request->validate([
            'application_type' => ['required', Rule::in(['mandiri', 'rekomendasi_kampus'])],
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'bidang' => ['required', Rule::in([...$divisionCodes, ...$legacyDivisionCodes])],
            'institusi' => ['required', 'string', 'max:255'],
            'jurusan' => ['required', 'string', 'max:255'],
            'nim_nisn' => ['required', 'string', 'regex:/^\d+$/', 'min:10', 'max:15'],
            'hp' => ['required', 'string', 'regex:/^(?:08\d{8,11}|628\d{7,10})$/'],
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
        ], [
            'nim_nisn.required' => 'NIM / NISN wajib diisi.',
            'nim_nisn.string' => 'NIM / NISN harus berupa teks angka.',
            'nim_nisn.regex' => 'NIM / NISN hanya boleh berisi angka.',
            'nim_nisn.min' => 'NIM / NISN minimal 10 digit.',
            'nim_nisn.max' => 'NIM / NISN maksimal 15 digit.',
            'hp.required' => 'Nomor HP / WhatsApp wajib diisi.',
            'hp.string' => 'Nomor HP / WhatsApp harus berupa teks angka.',
            'hp.regex' => 'Nomor HP / WhatsApp harus terdiri dari 10–13 digit dan diawali 08 atau 628.',
        ]);

        $divisionCode = match (Str::lower($validated['bidang'])) {
            'aptika' => 'aptika',
            'statistika' => 'statistik',
            default => Str::lower($validated['bidang']),
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

        if ($division->remainingQuota() <= 0) {
            return response()->json([
                'message' => 'Kuota bidang yang dipilih sudah penuh.',
                'errors' => ['bidang' => ['Kuota bidang ini sudah penuh. Silakan pilih bidang lain.']],
            ], 422);
        }

        $stored = [];
        DB::beginTransaction();
        try {
            $registrationDate = now(config('app.timezone'));
            $period = InternshipPeriod::query()
                ->where('division_id', $division->id)
                ->where('year', $registrationDate->year)
                ->where('month', $registrationDate->month)
                ->lockForUpdate()
                ->first();

            if (! $period) {
                DB::rollBack();

                return response()->json([
                    'message' => 'Pendaftaran untuk periode ini belum dibuka karena kuota belum diatur.',
                    'errors' => ['bidang' => ['Periode pendaftaran bidang ini belum dikonfigurasi. Silakan hubungi petugas.']],
                ], 422);
            }

            if (! $period->canRegister($registrationDate)) {
                DB::rollBack();

                return response()->json([
                    'message' => match ($period->registrationStatus($registrationDate)) {
                        'inactive' => 'Pendaftaran untuk periode ini belum dibuka.',
                        'before_start' => 'Pendaftaran untuk periode ini belum dimulai.',
                        'after_end' => 'Masa pendaftaran periode ini telah berakhir.',
                        default => 'Kuota pendaftaran bidang ini untuk periode berjalan sudah penuh.',
                    },
                    'errors' => ['bidang' => [match ($period->registrationStatus($registrationDate)) {
                        'inactive' => 'Periode pendaftaran bidang ini belum diaktifkan.',
                        'before_start' => 'Pendaftaran bidang ini belum dibuka pada tanggal tersebut.',
                        'after_end' => 'Masa pendaftaran bidang ini telah berakhir.',
                        default => 'Kuota pendaftaran bulanan bidang ini sudah penuh. Silakan pilih bidang lain.',
                    }]],
                ], 422);
            }

            $user = User::create([
                'name' => $validated['nama'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['pw']),
                'role' => 'applicant',
                'status_akun' => 'pending',
                'is_active' => false,
                'no_hp' => $validated['hp'],
                'division_id' => $division?->id,
            ]);

            foreach (['b1', 'b2', 'b3', 'b4'] as $key) {
                $stored[$key] = $request->file($key)->store('documents', 'public');
            }

            $application = InternApplication::create([
                'user_id' => $user->id,
                'application_type' => $validated['application_type'],
                'institution_name' => $validated['institusi'],
                'student_number' => $validated['nim_nisn'] ?? null,
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
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pendaftaran berhasil! Berkas Anda sedang ditinjau oleh pihak Diskominfo. Akun Anda akan diaktifkan setelah pendaftaran DITERIMA.',
                'redirect_url' => url('/login'),
                'tracking_code' => $application->tracking_code,
                'data' => ['tracking_code' => $application->tracking_code, 'status' => $application->status],
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
