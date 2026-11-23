<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Eksekutif Pelaksanaan Magang</title>
    <style>
        @page { size: A4 portrait; margin: 1.5cm 1.8cm; }
        body { font-family: "Times New Roman", Times, serif; color: #111111; font-size: 10pt; line-height: 1.35; }
        .letterhead { width: 100%; border: none; border-collapse: collapse; border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 14px; font-family: "Times New Roman", Times, serif; }
        .letterhead td { border: none; padding: 0; }
        .letterhead-logo { width: 72px; vertical-align: middle; text-align: center; }
        .letterhead-logo img { width: 58px; height: auto; }
        .letterhead-copy { text-align: center; vertical-align: middle; }
        .letterhead-copy p { margin: 0; text-align: center; }
        .government, .department, .address, .contact { font-size: 10pt; line-height: 1.25; }
        .department { font-weight: bold; }
        .contact-line { font-size: 9.5pt; white-space: nowrap; }
        h1 { font-size: 11pt; text-align: center; margin: 10px 0 4px; }
        .filters { text-align: center; margin-bottom: 10px; }
        h2 { font-size: 10pt; margin: 10px 0 5px; }
        table.data { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 8px 0; font-size: 9pt; line-height: 1.25; }
        table.data th, table.data td { border: 0.75pt solid #222222; padding: 5px 7px; vertical-align: middle; word-wrap: break-word; }
        table.data th { background-color: #F2F4F7; font-weight: bold; text-align: center; }
        .summary th { font-size: 9.5pt; }
        .summary td { padding: 8px 4px; text-align: center; font-size: 12pt; font-weight: bold; }
        .division-name { text-align: left; }
        .division-number { text-align: center; }
        .participant-no, .participant-center { text-align: center; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        .signature { width: 42%; margin: 18px 0 0 auto; text-align: center; page-break-inside: avoid; }
        .signature-space { height: 50pt; }
    </style>
</head>
<body>
    <table class="letterhead">
        <tr>
            <td class="letterhead-logo">
                <img src="<?php echo e(public_path('images/logo/logo_setda.png')); ?>" alt="Logo Kabupaten Tabalong">
            </td>
            <td class="letterhead-copy">
                <p class="government">PEMERINTAH KABUPATEN TABALONG</p>
                <p class="department">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                <p class="address">Jl. Cempaka No. 38 Tanjung, Tabalong, Kalimantan Selatan 71513</p>
                <p class="contact">Telepon (0526) 2023169</p>
                <p class="contact contact-line">Laman: https://diskominfo.tabalongkab.go.id | Pos-el: diskominfo@tabalongkab.go.id</p>
            </td>
        </tr>
    </table>

    <h1>LAPORAN EKSEKUTIF PELAKSANAAN MAGANG</h1>
    <div class="filters">
        <?php echo e($periodLabel); ?> &nbsp;|&nbsp; Bidang: <?php echo e($divisionName ?? 'Semua bidang'); ?>

    </div>

    <h2>Ringkasan Statistik</h2>
    <table class="data summary" style="width: 100%; table-layout: fixed;">
        <thead>
            <tr>
                <th>Total Pendaftar</th>
                <th>Peserta Diterima</th>
                <th>Peserta Aktif</th>
                <th>Peserta Lulus</th>
                <th>Rata-rata Kehadiran</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><?php echo e($report['summary']['total_applicants']); ?></td>
                <td><?php echo e($report['summary']['total_accepted']); ?></td>
                <td><?php echo e($report['summary']['total_active']); ?></td>
                <td><?php echo e($report['summary']['total_completed']); ?></td>
                <td><?php echo e($report['summary']['average_attendance_percentage'] === null ? '-' : number_format((float) $report['summary']['average_attendance_percentage'], 2, ',', '.') . '%'); ?></td>
            </tr>
        </tbody>
    </table>

    <h2>Rekapitulasi per Divisi/Bidang</h2>
    <table class="data divisions">
        <colgroup>
            <col style="width: 5%">
            <col style="width: 35%">
            <col style="width: 10%">
            <col style="width: 10%">
            <col style="width: 10%">
            <col style="width: 10%">
            <col style="width: 10%">
            <col style="width: 10%">
        </colgroup>
        <thead>
            <tr>
                <th>No</th><th style="text-align: left">Nama Bidang</th><th>Kuota</th><th>Pendaftar</th>
                <th>Diterima</th><th>Aktif</th><th>Lulus</th><th>Rata-rata Nilai</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $report['divisions']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $division): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td class="division-number"><?php echo e($loop->iteration); ?></td>
                    <td class="division-name"><?php echo e($division['division_name']); ?></td>
                    <td class="division-number"><?php echo e($division['quota']); ?></td>
                    <td class="division-number"><?php echo e($division['total_applicants']); ?></td>
                    <td class="division-number"><?php echo e($division['total_accepted']); ?></td>
                    <td class="division-number"><?php echo e($division['total_active']); ?></td>
                    <td class="division-number"><?php echo e($division['total_completed']); ?></td>
                    <td class="division-number"><?php echo e($division['average_final_score'] === null ? '-' : number_format((float) $division['average_final_score'], 2, ',', '.')); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr><td colspan="8" style="text-align:center">Tidak ada data divisi.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>

    <h2>Daftar Peserta Magang</h2>
    <table class="data participants">
        <colgroup>
            <col style="width: 5%">
            <col style="width: 18%">
            <col style="width: 22%">
            <col style="width: 12%">
            <col style="width: 16%">
            <col style="width: 11%">
            <col style="width: 8%">
            <col style="width: 8%">
        </colgroup>
        <thead>
            <tr>
                <th>No</th><th>Nama Peserta</th><th>Asal Instansi / Jurusan</th><th>Bidang</th>
                <th>Periode</th><th>Status</th><th>Kehadiran</th><th>Nilai Akhir</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $report['participants']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $participant): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td class="participant-no"><?php echo e($loop->iteration); ?></td>
                    <td><?php echo e($participant['participant_name'] ?? '-'); ?></td>
                    <td><?php echo e($participant['institution_name']); ?><br><?php echo e($participant['major'] ?? '-'); ?></td>
                    <td><?php echo e($participant['division_name'] ?? '-'); ?></td>
                    <td><?php echo e($participant['start_date']); ?> s.d. <?php echo e($participant['end_date']); ?></td>
                    <td><?php echo e($participant['internship_status'] === 'completed' ? 'Selesai' : ($participant['internship_status'] === 'in_progress' ? 'Aktif' : $participant['final_status'])); ?></td>
                    <td class="participant-center"><?php echo e($participant['attendance_percentage'] === null ? '-' : number_format((float) $participant['attendance_percentage'], 2, ',', '.') . '%'); ?></td>
                    <td class="participant-center"><?php echo e($participant['final_score'] ?? '-'); ?><?php echo e($participant['grade_letter'] ? ' / '.$participant['grade_letter'] : ''); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr><td colspan="8" style="text-align:center">Tidak ada peserta pada filter yang dipilih.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>

    <div class="signature">
        Tanjung, <?php echo e(now()->format('d-m-Y')); ?><br>
        Kepala Dinas Komunikasi<br>
        dan Informatika,
        <div class="signature-space"></div>
        <strong><u>EDDY SURIYANI, S.Sos, MA</u></strong><br>
        NIP. 197412231994031004
    </div>
</body>
</html>
<?php /**PATH C:\Users\HP\Downloads\simagang-backend-main\simagang-backend-main\resources\views\pdf\executive-report.blade.php ENDPATH**/ ?>