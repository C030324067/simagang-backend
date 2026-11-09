@php
    $activeRole = auth()->user()?->activeRole();
    $roleLabels = ['kabid' => 'Kepala Bidang', 'mentor' => 'Mentor'];
@endphp

@if ($activeRole)
    <div class="relative inline-flex items-center gap-3">
        <span class="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
            Aktif: {{ $roleLabels[$activeRole] ?? $activeRole }}
        </span>

        <details class="group relative">
            <summary class="cursor-pointer list-none rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Ganti konteks <span aria-hidden="true">⌄</span>
            </summary>
            <div class="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                @foreach (['kabid' => 'Kepala Bidang', 'mentor' => 'Mentor'] as $role => $label)
                    @if (auth()->user()->hasRole($role) && $role !== $activeRole)
                        <form method="POST" action="{{ route('role.switch') }}">
                            @csrf
                            <input type="hidden" name="role" value="{{ $role }}">
                            <button type="submit" class="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                                {{ $label }}
                            </button>
                        </form>
                    @endif
                @endforeach
            </div>
        </details>
    </div>
@endif
