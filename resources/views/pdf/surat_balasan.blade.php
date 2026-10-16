<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Balasan Permohonan Magang</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.5cm 2cm 1.5cm 2cm;
        }

        body {
            color: #000;
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.35;
        }

        p {
            margin: 0 0 6pt;
            text-align: justify;
        }

        /* Kop Surat - Rata Tengah */
        .letterhead {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4pt;
        }

        .letterhead-logo {
            width: 15%;
            vertical-align: middle;
            text-align: center;
        }

        .letterhead-logo img {
            width: 70px;
            height: auto;
        }

        .letterhead-copy {
            width: 85%;
            vertical-align: middle;
            text-align: center !important;
        }

        .letterhead-copy p {
            margin: 0;
            text-align: center !important;
        }

        .government {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        .department {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        .address, .contact {
            font-size: 8.5pt;
            line-height: 1.2;
        }

        .divider {
            border-top: 3px solid #000;
            border-bottom: 1px solid #000;
            height: 2px;
            margin-top: 4pt;
            margin-bottom: 14pt;
        }

        /* Metadata & Tanggal */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12pt;
        }

        .meta-table td {
            vertical-align: top;
            padding: 1pt 0;
        }

        .label-col { width: 60pt; }
        .colon-col { width: 10pt; }

        .date-col {
            text-align: right;
            vertical-align: top;
        }

        /* Kepada Yth - Rata Kiri */
        .recipient-box {
            margin-top: 10pt;
            margin-bottom: 14pt;
            margin-left: 0;
            text-align: left;
        }

        .recipient-box p {
            margin: 0;
            text-align: left !important;
            line-height: 1.25;
        }

        .indent-di { margin-left: 15pt; }
        .indent-tempat { margin-left: 30pt; }

        /* Isi Surat */
        .salutation {
            margin-top: 10pt;
            margin-bottom: 8pt;
            text-align: left;
        }

        .body-copy {
            text-indent: 30pt;
            margin-bottom: 10pt;
            line-height: 1.4;
            text-align: justify;
        }

        /* Tabel Peserta Magang */
        .participants {
            width: 100%;
            border-collapse: collapse;
            margin: 12pt 0;
            font-size: 9.5pt;
        }

        .participants th, .participants td {
            border: 1px solid #000;
            padding: 5pt 4pt;
            vertical-align: middle;
        }

        .participants th {
            font-weight: bold;
            text-align: center;
            background-color: #fcfcfc;
        }

        .center { text-align: center; }
        .left { text-align: left; }

        /* Tanda Tangan */
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25pt;
            page-break-inside: avoid;
        }

        .signature-box {
            width: 240px;
            text-align: center;
            float: right;
        }

        .signature-box p {
            margin: 0;
            text-align: center !important;
            line-height: 1.25;
        }

        .signature-space {
            height: 55pt;
        }

        .signer-name {
            font-weight: bold;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <!-- Kop Surat -->
    <table class="letterhead">
        <tr>
            <td class="letterhead-logo">
                <img src="{{ public_path('images/logo-tabalong.png') }}" alt="Logo Kab Tabalong">
            </td>
            <td class="letterhead-copy">
                <p class="government">PEMERINTAH KABUPATEN TABALONG</p>
                <p class="department">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                <p class="address">Jalan Cempaka No. 38 Tanjung, Tabalong, Kalimantan Selatan 71513</p>
                <p class="contact">Telepon (0526) 2023169</p>
                <p class="contact">Laman: https://diskominfo.tabalongkab.go.id, Pos-el: diskominfo@tabalongkab.go.id</p>
            </td>
        </tr>
    </table>
    <div class="divider"></div>

    <!-- Nomor & Tanggal Surat -->
    <table class="meta-table">
        <tr>
            <td class="label-col">Nomor</td>
            <td class="colon-col">:</td>
            <td>{{ $application->official_letter_number ?? $application->acceptance_letter_number ?? $pendaftar->official_letter_number ?? '-' }}</td>
            <td class="date-col">Tanjung, {{ $tanggalPenerbitan?->locale('id')->translatedFormat('j F Y') ?? now()->locale('id')->translatedFormat('j F Y') }}</td>
        </tr>
        <tr>
            <td class="label-col">Lampiran</td>
            <td class="colon-col">:</td>
            <td>-</td>
            <td></td>
        </tr>
        <tr>
            <td class="label-col">Sifat</td>
            <td class="colon-col">:</td>
            <td>Penting</td>
            <td></td>
        </tr>
        <tr>
            <td class="label-col">Perihal</td>
            <td class="colon-col">:</td>
            <td><strong>Balasan Surat Permohonan<br>Magang</strong></td>
            <td></td>
        </tr>
    </table>

    <!-- Tujuan / Kepada Yth. (Rata Kiri) -->
    <div class="recipient-box">
        <p>Kepada</p>
        <p>Yth. Pimpinan {{ $application->institution_name ?? $pendaftar->institution_name ?? '—' }}</p>
        <p class="indent-di">di -</p>
        <p class="indent-tempat">Tempat</p>
    </div>

    <!-- Isi Surat -->
    <p class="salutation">Dengan Hormat,</p>
    <p class="body-copy">
        Menindaklanjuti Surat Permohonan Magang
        @if (!empty($application->recommendation_letter_number ?? $pendaftar->recommendation_letter_number))
            dengan nomor <strong>{{ $application->recommendation_letter_number ?? $pendaftar->recommendation_letter_number }}</strong>
        @else
            dari {{ $application->institution_name ?? $pendaftar->institution_name ?? '—' }}
        @endif, 
        Bersama dengan surat ini kami <strong>Bersedia</strong> memberi kesempatan Magang kepada mahasiswa/i dari 
        {{ $application->institution_name ?? $pendaftar->institution_name ?? '—' }} di Dinas Komunikasi dan Informatika Kabupaten Tabalong
        @if (!empty($application->start_date) && !empty($application->end_date))
            selama periode <strong>{{ $application->start_date?->locale('id')->translatedFormat('j F Y') }} s/d {{ $application->end_date?->locale('id')->translatedFormat('j F Y') }}</strong>
        @endif. 
        Berikut ini adalah Nama-nama Mahasiswa/i yang akan melaksanakan Magang di Dinas Komunikasi dan Informatika Kabupaten Tabalong:
    </p>

    <!-- Tabel Peserta Magang -->
    <table class="participants">
        <colgroup>
            <col style="width: 7%">
            <col style="width: 22%">
            <col style="width: 15%">
            <col style="width: 18%">
            <col style="width: 23%">
            <col style="width: 15%">
        </colgroup>
        <thead>
            <tr>
                <th>NO</th>
                <th>NAMA</th>
                <th>NIM</th>
                <th>JURUSAN</th>
                <th>TEMPAT PKL</th>
                <th>NO HP</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="center">1</td>
                <td class="left">{{ $application->user?->name ?? $pendaftar->user?->name ?? '—' }}</td>
                <td class="center">{{ $application->student_number ?? $pendaftar->student_number ?? '—' }}</td>
                <td class="left">{{ $application->major ?? $pendaftar->major ?? '—' }}</td>
                <td class="left">
                    Dinas Komunikasi dan Informatika Kabupaten Tabalong
                    @if (!empty($application->division?->name ?? $pendaftar->division?->name))
                        — {{ $application->division?->name ?? $pendaftar->division?->name }}
                    @endif
                </td>
                <td class="center">{{ $application->user?->no_hp ?? $pendaftar->user?->no_hp ?? '—' }}</td>
            </tr>
        </tbody>
    </table>

    <p class="body-copy">
        Demikian surat ini kami sampaikan dan atas kerjasamanya kami ucapkan terima kasih.
    </p>

    <!-- Tanda Tangan Kepala Dinas -->
    <table class="signature-table">
        <tr>
            <td></td>
            <td style="width: 240px;">
                <div class="signature-box">
                    <p>Kepala Dinas Komunikasi<br>Dan Informatika,</p>
                    <div class="signature-space"></div>
                    <p>
                        <span class="signer-name">EDDY SURIYANI, S.Sos, MA</span><br>
                        NIP. 197412231994031004
                    </p>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>