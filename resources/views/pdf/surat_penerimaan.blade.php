<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Balasan Permohonan Magang</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 2cm 2.5cm 2cm;
        }

        body {
            color: #111;
            font-family: "Times New Roman", serif;
            font-size: 11pt;
            line-height: 1.35;
        }

        p {
            margin: 0 0 9pt;
            text-align: justify;
        }

        .letterhead {
            border-collapse: collapse;
            margin-bottom: 4pt;
            width: 100%;
        }

        .letterhead-logo {
            text-align: left;
            vertical-align: middle;
            width: 18%;
        }

        .letterhead-logo img {
            height: 88px;
            width: 74px;
        }

        .letterhead-copy {
            text-align: center;
            vertical-align: middle;
            width: 82%;
        }

        .letterhead-copy p {
            margin: 0;
            text-align: center;
        }

        .government {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        .department {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        .address,
        .contact {
            font-size: 9pt;
            line-height: 1.2;
        }

        .letterhead-rules {
            margin-bottom: 16pt;
        }

        .rule-thick {
            border-top: 3px solid #111;
            margin-bottom: 2px;
        }

        .rule-thin {
            border-top: 1px solid #111;
        }

        .metadata {
            border-collapse: collapse;
            margin-bottom: 16pt;
            width: 100%;
        }

        .metadata td {
            padding: 0 4pt 2pt 0;
            vertical-align: top;
        }

        .metadata-left {
            width: 52%;
        }

        .metadata-right {
            padding-left: 10pt !important;
            width: 48%;
        }

        .metadata-label {
            width: 55pt;
        }

        .metadata-colon {
            padding-right: 5pt !important;
            width: 8pt;
        }

        .recipient {
            margin-top: 12pt;
        }

        .recipient p {
            margin-bottom: 0;
            text-align: left;
        }

        .body-copy {
            margin-bottom: 8pt;
            text-indent: 28pt;
        }

        .participants {
            border-collapse: collapse;
            font-size: 9pt;
            margin: 10pt 0;
            page-break-inside: avoid;
            table-layout: fixed;
            width: 100%;
        }

        .participants th,
        .participants td {
            border: 1px solid #111;
            padding: 4pt 3pt;
            vertical-align: middle;
        }

        .participants th {
            font-weight: bold;
            text-align: center;
        }

        .participants td {
            text-align: left;
            word-wrap: break-word;
        }

        .participants td:first-child {
            text-align: center;
        }

        .participants thead {
            display: table-header-group;
        }

        .participants tr {
            page-break-inside: avoid;
        }

        .signature {
            margin-left: auto;
            margin-top: 22pt;
            page-break-inside: avoid;
            text-align: center;
            width: 225px;
        }

        .signature p {
            margin: 0;
            text-align: center;
        }

        .signature-space {
            height: 58pt;
        }

        .signer-name {
            font-weight: bold;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <table class="letterhead">
        <tr>
            <td class="letterhead-logo">
                <img src="{{ public_path('images/logo-tabalong.png') }}" alt="Lambang Kabupaten Tabalong">
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
    <div class="letterhead-rules">
        <div class="rule-thick"></div>
        <div class="rule-thin"></div>
    </div>

    <table class="metadata">
        <tr>
            <td class="metadata-left">
                <table>
                    <tr>
                        <td class="metadata-label">Nomor</td>
                        <td class="metadata-colon">:</td>
                        <td>{{ $application->official_letter_number ?? $application->acceptance_letter_number ?? $pendaftar->official_letter_number ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td class="metadata-label">Lampiran</td>
                        <td class="metadata-colon">:</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td class="metadata-label">Sifat</td>
                        <td class="metadata-colon">:</td>
                        <td>Penting</td>
                    </tr>
                    <tr>
                        <td class="metadata-label">Perihal</td>
                        <td class="metadata-colon">:</td>
                        <td>Balasan Surat Permohonan Magang</td>
                    </tr>
                </table>
            </td>
            <td class="metadata-right">
                <p>Tanjung, {{ $tanggalPenerbitan?->locale('id')->translatedFormat('j F Y') ?? '—' }}</p>
                <div class="recipient">
                    <p>Kepada Yth.</p>
                    <p>Pimpinan {{ $application->institution_name ?: '—' }}</p>
                    <p>di Tempat</p>
                </div>
            </td>
        </tr>
    </table>

    <p>Dengan hormat,</p>
    <p class="body-copy">
        Menindaklanjuti surat permohonan magang
        @if ($application->recommendation_letter_number)
            Nomor {{ $application->recommendation_letter_number }}
        @else
            dari {{ $application->institution_name ?: '—' }}
        @endif
        , dengan ini kami menyampaikan bahwa permohonan magang atas nama peserta berikut dapat
        diterima untuk melaksanakan praktik kerja lapangan pada Dinas Komunikasi dan Informatika
        Kabupaten Tabalong selama periode
        {{ $application->start_date?->locale('id')->translatedFormat('j F Y') ?? '—' }}
        sampai dengan
        {{ $application->end_date?->locale('id')->translatedFormat('j F Y') ?? '—' }}.
    </p>

    <table class="participants">
        <colgroup>
            <col style="width: 6%">
            <col style="width: 22%">
            <col style="width: 15%">
            <col style="width: 19%">
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
                <td>1</td>
                <td>{{ $application->user?->name ?: '—' }}</td>
                <td>{{ $application->student_number ?: '—' }}</td>
                <td>{{ $application->major ?: '—' }}</td>
                <td>
                    Dinas Komunikasi dan Informatika Kabupaten Tabalong
                    @if ($application->division?->name)
                        — {{ $application->division->name }}
                    @endif
                </td>
                <td>{{ $application->user?->no_hp ?: '—' }}</td>
            </tr>
        </tbody>
    </table>

    <p class="body-copy">
        Peserta diharapkan menaati ketentuan dan tata tertib yang berlaku di lingkungan
        Dinas Komunikasi dan Informatika Kabupaten Tabalong.
    </p>
    <p class="body-copy">
        Demikian surat balasan ini disampaikan. Atas perhatian dan kerja sama yang baik,
        kami ucapkan terima kasih.
    </p>

    <div class="signature">
        <p>Kepala Dinas Komunikasi Dan Informatika,</p>
        <div class="signature-space"></div>
        <p>
            <span class="signer-name">EDDY SURIYANI, S.Sos, MA</span><br>
            NIP. 197412231994031004
        </p>
    </div>
</body>
</html>
