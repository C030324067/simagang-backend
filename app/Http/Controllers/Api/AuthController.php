<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register a new applicant account pending approval.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', Password::min(6)],
            'no_hp' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'applicant',
            'status_akun' => 'pending',
            'no_hp' => $validated['no_hp'] ?? null,
        ]);

        return $this->successResponse([
            'user' => $user,
        ], 'Pendaftaran berhasil! Berkas Anda sedang ditinjau oleh pihak Diskominfo. Akun Anda akan diaktifkan setelah pendaftaran DITERIMA.', 201);
    }

    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return $this->errorResponse('Email tidak terdaftar.', 401);
        }

        if (! Hash::check($validated['password'], $user->password)) {
            return $this->errorResponse('Password yang Anda masukkan salah.', 401);
        }

        if ($user->role === 'applicant') {
            if ($user->status_akun === 'pending') {
                return $this->errorResponse('Mohon maaf, permohonan magang Anda masih dalam proses verifikasi oleh Diskominfo.', 403);
            }

            if ($user->status_akun === 'rejected') {
                return $this->errorResponse('Mohon maaf, permohonan magang Anda belum dapat diterima.', 403);
            }

            if ($user->status_akun !== 'approved') {
                return $this->errorResponse('Akun Anda belum disetujui untuk login.', 403);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->load(['division', 'activeApplication.division']);

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], 'Login berhasil');
    }

    /**
     * Revoke current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logout berhasil');
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'division',
            'activeApplication.division',
            'evaluations',
            'certificates',
        ]);

        return $this->successResponse($user, 'Data pengguna berhasil diambil');
    }
}
