<div class="min-h-screen bg-gray-50">
    <x-navbar-role-switcher />
    <main class="mx-auto max-w-7xl space-y-6 p-6">
        <h1 class="text-2xl font-semibold">Dashboard Mentor</h1>
        <section>
            <h2 class="text-lg font-medium">Peserta bimbingan ({{ $applications->count() }})</h2>
            <ul class="divide-y">
                @foreach ($applications as $application)
                    <li class="py-3">{{ $application->user?->name }} — {{ $application->tracking_code }}</li>
                @endforeach
            </ul>
        </section>
        <section>
            <h2 class="text-lg font-medium">Presensi menunggu verifikasi ({{ $pendingAttendances->count() }})</h2>
        </section>
        <section>
            <h2 class="text-lg font-medium">Logbook menunggu persetujuan ({{ $pendingLogbooks->count() }})</h2>
        </section>
    </main>
</div>
