<div class="min-h-screen bg-gray-50">
    <x-navbar-role-switcher />
    <main class="mx-auto max-w-7xl p-6">
        <h1 class="text-2xl font-semibold">Dashboard Kepala Bidang</h1>
        <p class="mt-2">Total permohonan: {{ $totalApplications }}</p>
        <p>Menunggu verifikasi: {{ $pendingApplications }}</p>
        <ul class="mt-4 divide-y">
            @foreach ($applications as $application)
                <li class="py-3">{{ $application->tracking_code }} — {{ $application->final_status }}</li>
            @endforeach
        </ul>
    </main>
</div>
