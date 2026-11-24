<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Sertifikat Magang - <?php echo e($intern->name ?? 'Peserta'); ?></title>
    <?php
        $tabalongPath = public_path('images/logo-tabalong.png');
        $komdigiPath = public_path('images/logo-komdigi.png');
        $logoTabalong = is_file($tabalongPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($tabalongPath))
            : null;
        $logoKomdigi = is_file($komdigiPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($komdigiPath))
            : null;
        $photoPath = $intern?->profile_photo_path
            ? storage_path('app/public/'.$intern->profile_photo_path)
            : null;
        $photoData = $photoPath && is_file($photoPath)
            ? 'data:'.(mime_content_type($photoPath) ?: 'image/jpeg').';base64,'.base64_encode(file_get_contents($photoPath))
            : null;
        $isSmk = $education_level === 'SMK';
        $studentNumberLabel = $isSmk ? 'NISN' : 'NIM';
        $institutionName = $application?->institution_name ?? '-';
        $major = $application?->major ?? '-';
        $divisionName = $application?->division?->name ?? $intern?->division?->name ?? '-';
        $divisionName = preg_replace('/^Bidang\s+/i', '', $divisionName);
        $issuedDateText = \Carbon\Carbon::parse($issued_date)->locale('id')->translatedFormat('d F Y');
        $startDateText = $application?->start_date
            ? \Carbon\Carbon::parse($application->start_date)->locale('id')->translatedFormat('d F Y')
            : '-';
        $endDateText = $application?->end_date
            ? \Carbon\Carbon::parse($application->end_date)->locale('id')->translatedFormat('d F Y')
            : '-';
        $technicalTotal = collect($technical_scores)->sum(fn ($item) => (float) ($item['score'] ?? 0));
        $skillTotal = collect($skill_scores)->sum(fn ($item) => (float) ($item['score'] ?? 0));
    ?>
    <style>
        @page { size: 297mm 210mm; margin: 0; }
        * { box-sizing: border-box; color: #000000 !important; }
        html, body { margin: 0; padding: 0; background: #ffffff; color: #000000; font-family: 'DejaVu Sans', Arial, sans-serif; }
        table { border-collapse: collapse; }
        p { padding: 0; }

        .letterhead { width: 100%; table-layout: fixed; }
        .letterhead td { vertical-align: middle; }
        .letterhead-left, .letterhead-right { width: 16%; }
        .letterhead-left { padding-right: 14px; text-align: right; }
        .letterhead-right { padding-left: 14px; text-align: left; }
        .letterhead-left img, .letterhead-right img { height: 68px; width: auto; }
        .letterhead-center { width: 68%; text-align: center; }
        .government { margin: 0; font-size: 13.5pt; font-weight: bold; }
        .department { margin: 2px 0; font-size: 18pt; font-weight: bold; }
        .address { margin: 0; font-size: 8.5pt; }
        .contact { margin: 2px 0 0; font-size: 8pt; }
        .gold-divider { height: 0; margin: 5px 0 8px; border-bottom: 1.5px solid #b59449; }
        .certificate-title { margin: 0; font-family: 'DejaVu Serif', serif; font-size: 26pt; font-weight: bold; letter-spacing: 2px; text-align: center; }
        .certificate-number { margin: 2px 0 10px; font-size: 10pt; font-weight: bold; text-align: center; }
        .recipient-layout { width: 68%; margin: 0 auto; }
        .recipient-photo-cell { width: 115px; vertical-align: top; }
        .recipient-info { padding-left: 10px; vertical-align: top; }
        .photo-frame { width: 96px; height: 126px; border: 1.5px solid #000000; text-align: center; vertical-align: middle; overflow: hidden; }
        .photo-frame img { max-width: 94px; max-height: 124px; width: auto; height: auto; }
        .recipient-label { margin: 0 0 4px; font-size: 9.5pt; font-style: italic; }
        .biodata { width: 100%; font-size: 10pt; line-height: 1.35; }
        .biodata td { padding: 1px 0; vertical-align: top; }
        .biodata .label { width: 100px; }
        .biodata .colon { width: 12px; text-align: center; }
        .intern-name { font-weight: bold; text-transform: uppercase; }
        .description { width: 82%; margin: 12px auto 8px; font-size: 11pt; line-height: 1.35; text-align: center; }
        .result-badge { width: 270px; margin: 0 auto; padding: 6px 14px; border: 1.5px solid #b59449; font-size: 13.5pt; font-weight: bold; text-align: center; }
        .certificate-footer { width: 100%; margin-top: 10px; table-layout: fixed; }
        .certificate-footer td { vertical-align: bottom; }
        .qr-cell { width: 45%; }
        .qr-box { width: 102px; height: 102px; padding: 3px; border: 1px solid #000000; text-align: center; vertical-align: middle; }
        .qr-box img { width: 96px; height: 96px; }
        .qr-caption { margin-top: 3px; font-size: 7.5pt; }
        .signature-kadis { width: 60%; font-size: 9.5pt; line-height: 1.3; text-align: right; }
        .signature-space { height: 65px; }
        .signature-name { font-weight: bold; text-decoration: underline; }
        .transcript-title { margin: 0; font-size: 15pt; font-weight: bold; text-align: center; }
        .transcript-divider { height: 0; margin: 4px 0 8px; border-bottom: 1.5px solid #000000; }
        .section-title { margin: 0 0 3px; font-size: 9pt; font-weight: bold; }
        .technical-section { margin-top: 8px; }
        .score-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 8.5pt; background: #ffffff; }
        .score-table th, .score-table td { padding: 2.5px 6px; border: 1px solid #000000; color: #000000 !important; background: #ffffff; }
        .score-table .number { width: 38px; text-align: center; }
        .score-table .criteria { text-align: left; }
        .score-table .score { width: 75px; text-align: center; }
        .score-table .total-row td { font-weight: bold; }
        .summary { margin: 6px 0; font-size: 9.5pt; font-weight: bold; }
        .summary-grade { padding-left: 18px; }
        .bottom-layout { width: 100%; margin-top: 6px; table-layout: fixed; }
        .bottom-layout td { vertical-align: bottom; }
        .scale-cell { width: 44%; }
        .scale-title { margin: 0 0 3px; font-size: 8pt; font-weight: bold; }
        .scale-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: center; background: #ffffff; }
        .scale-table th, .scale-table td { padding: 2.5px 4px; border: 1px solid #000000; color: #000000 !important; background: #ffffff; }
        .mentor-signature { width: 56%; padding-top: 10px; font-size: 9.5pt; line-height: 1.35; text-align: right; }
        .mentor-signature-space { height: 60px; }
    </style>
</head>
<body>
    <div style="position: fixed; top: 8mm; left: 10mm; right: 10mm; bottom: 8mm; border: 4px solid #0f2c59;"></div>
    <div style="position: fixed; top: 9.8mm; left: 11.8mm; right: 11.8mm; bottom: 9.8mm; border: 1.5px solid #b59449;"></div>

    <div style="padding: 13mm 17mm 0 17mm;">
        <table style="width: 100%; height: 184mm; border-collapse: collapse;">
                <tr><td style="vertical-align: top;">
            <table class="letterhead">
                <tr>
                    <td class="letterhead-left"><?php if($logoTabalong): ?><img src="<?php echo e($logoTabalong); ?>" alt="Logo Kabupaten Tabalong"><?php endif; ?></td>
                    <td class="letterhead-center">
                        <p class="government">PEMERINTAH KABUPATEN TABALONG</p>
                        <p class="department">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                        <p class="address">Jl. Cempaka No. 38 Tanjung, Tabalong, Kalimantan Selatan 71513</p>
                        <p class="contact">Telepon (0526) 2023169 · diskominfo.tabalongkab.go.id · diskominfo@tabalongkab.go.id</p>
                    </td>
                    <td class="letterhead-right"><?php if($logoKomdigi): ?><img src="<?php echo e($logoKomdigi); ?>" alt="Logo KOMDIGI"><?php endif; ?></td>
                </tr>
            </table>
            <div class="gold-divider"></div>
            <h1 class="certificate-title">SERTIFIKAT</h1>
            <p class="certificate-number">Nomor : <?php echo e($certificate->certificate_number ?? '-'); ?></p>

            <table class="recipient-layout">
                <tr>
                    <td class="recipient-photo-cell">
                        <div class="photo-frame">
                            <?php if($photoData): ?>
                                <img src="<?php echo e($photoData); ?>" alt="Pas foto peserta" style="max-width: 94px; max-height: 124px; width: auto; height: auto;">
                            <?php else: ?>
                                <table style="width: 100%; height: 100%; border-collapse: collapse;">
                                    <tr><td style="text-align: center; vertical-align: middle;">PAS FOTO 3x4</td></tr>
                                </table>
                            <?php endif; ?>
                        </div>
                    </td>
                    <td class="recipient-info">
                        <p class="recipient-label">Diberikan kepada:</p>
                        <table class="biodata">
                            <tr><td class="label">Nama</td><td class="colon">:</td><td class="value intern-name"><?php echo e($intern->name ?? 'Peserta Magang'); ?></td></tr>
                            <tr><td class="label"><?php echo e($studentNumberLabel); ?></td><td class="colon">:</td><td class="value"><?php echo e($application?->student_number ?? '-'); ?></td></tr>
                            <tr><td class="label">Jurusan</td><td class="colon">:</td><td class="value"><?php echo e($major); ?></td></tr>
                            <tr><td class="label">Asal Institusi</td><td class="colon">:</td><td class="value"><?php echo e($institutionName); ?></td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p class="description">Telah mengikuti program magang selama <?php echo e($duration_months); ?> bulan terhitung dari tanggal <?php echo e($startDateText); ?> s/d <?php echo e($endDateText); ?> dengan hasil:</p>
            <div class="result-badge"><?php echo e($grade_description); ?></div>
                </td></tr>
                <tr><td style="vertical-align: bottom;">
        <table class="certificate-footer">
            <tr>
                <td class="qr-cell">
                    <table class="qr-box"><tr><td>
                        <?php if(! empty($qr_code_data_uri)): ?>
                            <img src="<?php echo e($qr_code_data_uri); ?>" alt="QR code verifikasi sertifikat">
                        <?php else: ?>
                            <span>QR CODE</span>
                        <?php endif; ?>
                    </td></tr></table>
                    <div class="qr-caption">Pindai untuk verifikasi sertifikat</div>
                </td>
                <td class="signature-kadis">
                    <div>Tanjung, <?php echo e($issuedDateText); ?></div>
                    <div>Kepala Dinas Komunikasi dan Informatika,</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">Eddy Suryani, S.Sos, MA</div>
                    <div>Pembina Tk. I/(IV/b)</div>
                    <div>NIP 197412231994031004</div>
                </td>
            </tr>
        </table>
                </td></tr>
        </table>
    </div>

    <div style="page-break-before: always;"></div>

    <div style="padding: 13mm 17mm 0 17mm;">
        <table style="width: 100%; height: 184mm; border-collapse: collapse;">
                <tr><td style="vertical-align: top;">
        <h1 class="transcript-title">DAFTAR NILAI</h1>
        <div class="transcript-divider"></div>

        <p class="section-title">NILAI KETERAMPILAN</p>
        <table class="score-table">
            <thead><tr><th class="number">NO.</th><th class="criteria">KRITERIA PENILAIAN</th><th class="score">NILAI</th></tr></thead>
            <tbody>
                <?php $__currentLoopData = $skill_scores; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <tr><td class="number"><?php echo e($index + 1); ?></td><td class="criteria"><?php echo e($item['criteria']); ?></td><td class="score"><?php echo e(is_numeric($item['score']) ? number_format((float) $item['score'], 2) : '—'); ?></td></tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                <tr class="total-row"><td class="number"></td><td>Jumlah Nilai Keterampilan</td><td class="score"><?php echo e(number_format($skillTotal, 2)); ?></td></tr>
            </tbody>
        </table>

        <div class="technical-section">
            <p class="section-title">NILAI TEKNIS</p>
            <table class="score-table">
                <thead><tr><th class="number">NO.</th><th class="criteria">KRITERIA PENILAIAN</th><th class="score">NILAI</th></tr></thead>
                <tbody>
                    <?php $__empty_1 = true; $__currentLoopData = $technical_scores; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                        <tr><td class="number"><?php echo e($index + 1); ?></td><td class="criteria"><?php echo e($item['criteria'] ?? 'Aspek Teknis'); ?></td><td class="score"><?php echo e(is_numeric($item['score'] ?? null) ? number_format((float) $item['score'], 2) : '—'); ?></td></tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                        <tr><td class="number">-</td><td class="criteria">Belum ada nilai teknis</td><td class="score">—</td></tr>
                    <?php endif; ?>
                    <tr class="total-row"><td class="number"></td><td>Jumlah Nilai Teknis</td><td class="score"><?php echo e(number_format($technicalTotal, 2)); ?></td></tr>
                </tbody>
            </table>
        </div>

        <div class="summary">
            Nilai Akhir: <?php echo e(number_format((float) ($evaluation?->final_score ?? 0), 2)); ?> (<?php echo e($grade_letter); ?>)
            <span class="summary-grade">Sebutan: <?php echo e(mb_strtoupper($grade_description)); ?></span>
        </div>

                </td></tr>
                <tr><td style="vertical-align: bottom;">
        <table class="bottom-layout">
            <tr>
                <td class="scale-cell">
                    <p class="scale-title">KETERANGAN NILAI</p>
                    <table class="scale-table">
                        <thead><tr><th>RENTANG</th><th>MUTU</th><th>SEBUTAN</th></tr></thead>
                        <tbody>
                            <tr><td>90 - 100</td><td>A</td><td>SANGAT BAIK</td></tr>
                            <tr><td>80 - 89</td><td>B</td><td>BAIK</td></tr>
                            <tr><td>60 - 79</td><td>C</td><td>CUKUP</td></tr>
                            <tr><td>00 - 59</td><td>D</td><td>KURANG</td></tr>
                        </tbody>
                    </table>
                </td>
                <td class="mentor-signature">
                    <div>Tanjung, <?php echo e($issuedDateText); ?></div>
                    <div>Kabid <?php echo e($divisionName); ?></div>
                    <div class="mentor-signature-space"></div>
                    <div class="signature-name"><?php echo e($kabid_name ?: 'Nama Kabid belum tersedia'); ?></div>
                    <?php if(! empty($kabid_nip)): ?>
                        <div>NIP <?php echo e($kabid_nip); ?></div>
                    <?php endif; ?>
                </td>
            </tr>
        </table>
                </td></tr>
        </table>
    </div>
</body>
</html>
<?php /**PATH C:\Users\HP\Downloads\simagang-backend-main\simagang-backend-main\resources\views/pdf/certificate.blade.php ENDPATH**/ ?>