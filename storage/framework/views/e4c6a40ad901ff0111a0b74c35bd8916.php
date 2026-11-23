<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Penerimaan Magang</title>
</head>
<body>
    <p>Yth. <?php echo e($application->user->name); ?>,</p>

    <p>Selamat, permohonan magang Anda di Diskominfo telah diterima.</p>

    <p>
        <strong>Institusi:</strong> <?php echo e($application->institution_name); ?><br>
        <strong>Bidang:</strong> <?php echo e($application->division?->name ?? '-'); ?><br>
        <strong>Periode:</strong> <?php echo e($application->start_date?->format('d-m-Y')); ?> sampai <?php echo e($application->end_date?->format('d-m-Y')); ?><br>
        <strong>Nomor surat:</strong> <?php echo e($application->acceptance_letter_number ?? '-'); ?>

    </p>

    <p>Surat penerimaan resmi terlampir pada email ini. Simpan dokumen tersebut sebagai bukti penerimaan magang.</p>

    <p>Hormat kami,<br>Admin Kepegawaian SIMAGANG</p>
</body>
</html>
<?php /**PATH C:\Users\HP\Downloads\simagang-backend-main\simagang-backend-main\resources\views\emails\official-acceptance-letter.blade.php ENDPATH**/ ?>