<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountExpiration
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isIntern() || in_array($user->role, User::INTERNAL_ROLES, true)) {
            return $next($request);
        }

        if (! $user->isExpired()) {
            return $next($request);
        }

        $user->forceFill(['status_akun' => 'expired', 'is_active' => false])->save();
        $user->applications()
            ->where('final_status', 'accepted')
            ->update(['internship_status' => 'completed']);
        $user->tokens()->delete();
        $gracePeriodUntil = $user->gracePeriodEnd();
        $message = $gracePeriodUntil
            ? 'Masa aktif akun Anda telah berakhir pada '.$gracePeriodUntil->format('d-m-Y').'. Silakan hubungi admin Diskominfo jika memerlukan akses kembali.'
            : 'Akun Intern tidak memiliki aplikasi magang aktif yang tertaut. Silakan hubungi admin Diskominfo.';

        return response()->json([
            'success' => false,
            'code' => 'ACCOUNT_EXPIRED',
            'message' => $message,
        ], Response::HTTP_FORBIDDEN);
    }
}
