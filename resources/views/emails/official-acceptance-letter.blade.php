<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Penerimaan Magang</title>
</head>
<body>
    <p>Yth. {{ $application->user->name }},</p>

    <p>Selamat, permohonan magang Anda di Diskominfo telah diterima.</p>

    <p>
        <strong>Institusi:</strong> {{ $application->institution_name }}<br>
        <strong>Bidang:</strong> {{ $application->division?->name ?? '-' }}<br>
        <strong>Periode:</strong> {{ $application->start_date?->format('d-m-Y') }} sampai {{ $application->end_date?->format('d-m-Y') }}<br>
        <strong>Nomor surat:</strong> {{ $application->acceptance_letter_number ?? '-' }}
    </p>

    <p>Surat penerimaan resmi terlampir pada email ini. Simpan dokumen tersebut sebagai bukti penerimaan magang.</p>

    <p>Hormat kami,<br>Admin Kepegawaian SIMAGANG</p>
</body>
</html>
