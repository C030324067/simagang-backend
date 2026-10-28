<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountExpiration
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isIntern()) {
            return $next($request);
        }

        $application = $user->applications()
            ->where('final_status', 'accepted')
            ->orderByDesc('end_date')
            ->first();

        if (! $application?->end_date) {
            return $next($request);
        }

        $gracePeriodUntil = $application->end_date->copy()->addDays(7);

        if (now(config('app.timezone'))->toDateString() <= $gracePeriodUntil->toDateString()) {
            return $next($request);
        }

        $user->forceFill(['status_akun' => 'expired', 'is_active' => false])->save();
        $user->tokens()->delete();

        return response()->json([
            'success' => false,
            'code' => 'ACCOUNT_EXPIRED',
            'message' => 'Masa aktif akun Anda telah berakhir pada '.$gracePeriodUntil->format('d-m-Y').'. Silakan hubungi admin Diskominfo jika memerlukan akses kembali.',
        ], Response::HTTP_FORBIDDEN);
    }
}
