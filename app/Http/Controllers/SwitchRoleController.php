<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SwitchRoleController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['kabid', 'mentor'])],
        ]);
        $user = $request->user();

        // Never trust a role supplied by the browser; verify it against the account.
        if (! $user || ! $user->hasRole($validated['role'])) {
            if ($request->expectsJson()) {
                return $this->errorResponse('Anda tidak memiliki akses ke konteks tersebut.', 403);
            }

            return back()->with('error', 'Anda tidak memiliki akses ke konteks tersebut.');
        }

        $request->session()->put('active_role', $validated['role']);

        if ($request->expectsJson()) {
            return $this->successResponse(['active_role' => $validated['role']], 'Konteks berhasil diganti.');
        }

        return back()->with('success', 'Konteks berhasil diganti.');
    }
}
