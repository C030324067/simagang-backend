<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Balasan Penerimaan Magang</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 2.5cm 2.5cm 2cm;
        }

        body {
            color: #111;
            font-family: "Times New Roman", serif;
            font-size: 12pt;
            line-height: 1.5;
        }

        .kop {
            border-bottom: 3px solid #111;
            margin-bottom: 24px;
            padding-bottom: 10px;
            text-align: center;
        }

        .kop p {
            margin: 0;
        }

        .kop .pemerintah {
            font-size: 14pt;
            font-weight: bold;
            letter-spacing: 1px;
        }

        .kop .dinas {
            font-size: 18pt;
            font-weight: bold;
        }

        .kop .alamat {
            font-size: 10pt;
        }

        .nomor {
            margin-bottom: 24px;
            text-align: center;
            text-decoration: underline;
            font-weight: bold;
        }

        .meta {
            margin-bottom: 24px;
        }

        .meta td {
            padding: 1px 8px 1px 0;
            vertical-align: top;
        }

        .data {
            border-collapse: collapse;
            margin: 16px 0;
            width: 100%;
        }

        .data td {
            padding: 3px 0;
            vertical-align: top;
        }

        .data td:first-child {
            width: 190px;
        }

        .signature {
            margin-left: auto;
            margin-top: 44px;
            text-align: center;
            width: 240px;
        }

        .signature-space {
            height: 72px;
        }
    </style>
</head>
<body>
    <header class="kop">
        <p class="pemerintah">PEMERINTAH KABUPATEN TABALONG</p>
        <p class="dinas">DINAS KOMUNIKASI DAN INFORMATIKA</p>
        <p class="alamat">Kabupaten Tabalong, Provinsi Kalimantan Selatan</p>
    </header>

    <p class="nomor">SURAT BALASAN PENERIMAAN MAGANG</p>

    <table class="meta">
        <tr>
            <td>Nomor</td>
            <td>:</td>
            <td><?php echo e($pendaftar->acceptance_letter_number); ?></td>
        </tr>
        <tr>
            <td>Perihal</td>
            <td>:</td>
            <td>Penerimaan Magang</td>
        </tr>
    </table>

    <p>Yth. Pimpinan <?php echo e($pendaftar->institution_name); ?></p>
    <p>Dengan hormat,</p>
    <p>
        Menindaklanjuti permohonan magang yang diajukan, dengan ini kami menyampaikan bahwa
        peserta berikut diterima untuk melaksanakan kegiatan magang pada Dinas Komunikasi dan
        Informatika Kabupaten Tabalong:
    </p>

    <table class="data">
        <tr>
            <td>Nama</td>
            <td>: <?php echo e($pendaftar->user->name); ?></td>
        </tr>
        <tr>
            <td>NIM / NISN</td>
            <td>: <?php echo e($pendaftar->student_number ?: '-'); ?></td>
        </tr>
        <tr>
            <td>Asal perguruan tinggi / sekolah</td>
            <td>: <?php echo e($pendaftar->institution_name); ?></td>
        </tr>
        <tr>
            <td>Program studi / jurusan</td>
            <td>: <?php echo e($pendaftar->major ?: '-'); ?></td>
        </tr>
        <tr>
            <td>Divisi penempatan</td>
            <td>: <?php echo e($pendaftar->division->name); ?></td>
        </tr>
        <tr>
            <td>Periode magang</td>
            <td>: <?php echo e($pendaftar->start_date?->format('d-m-Y')); ?> s.d. <?php echo e($pendaftar->end_date?->format('d-m-Y')); ?></td>
        </tr>
    </table>

    <p>
        Surat balasan ini diterbitkan pada <?php echo e($tanggalPenerbitan->translatedFormat('d F Y')); ?>.
        Peserta diharapkan menaati ketentuan dan tata tertib yang berlaku di lingkungan
        Dinas Komunikasi dan Informatika Kabupaten Tabalong.
    </p>
    <p>Demikian disampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>

    <div class="signature">
        <p>Kepala Dinas Komunikasi dan Informatika</p>
        <div class="signature-space"></div>
        <p>
            <strong><?php echo e($pendaftar->verifierKadis?->name ?: ' '); ?></strong><br>
            <?php if($pendaftar->verifierKadis?->nip): ?>
                NIP. <?php echo e($pendaftar->verifierKadis->nip); ?>

            <?php endif; ?>
        </p>
    </div>
</body>
</html>
<?php /**PATH C:\Users\HP\Downloads\simagang-backend-main\simagang-backend-main\resources\views/pdf/surat_penerimaan.blade.php ENDPATH**/ ?>