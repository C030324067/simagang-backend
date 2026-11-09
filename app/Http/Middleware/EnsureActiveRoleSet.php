<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveRoleSet
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $activeRole = $request->session()->get('active_role');
        $eligibleRoles = array_values(array_filter(
            ['kabid', 'mentor'],
            fn (string $role): bool => $user->hasRole($role),
        ));

        if (! in_array($activeRole, $eligibleRoles, true)) {
            $request->session()->put('active_role', $eligibleRoles[0] ?? null);
        }

        return $next($request);
    }
}
