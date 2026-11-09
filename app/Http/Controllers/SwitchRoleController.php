<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SwitchRoleController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['kabid', 'mentor'])],
        ]);
        $user = $request->user();

        // Never trust a role supplied by the browser; verify it against the account.
        if (! $user || ! $user->hasRole($validated['role'])) {
            return back()->with('error', 'Anda tidak memiliki akses ke konteks tersebut.');
        }

        $request->session()->put('active_role', $validated['role']);

        return back()->with('success', 'Konteks berhasil diganti.');
    }
}
