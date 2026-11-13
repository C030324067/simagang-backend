<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Sertifikat Magang - {{ $intern->name ?? 'Peserta' }}</title>
    @php
        $komdigiPath = public_path('images/logo/logo komdigi.png');
        $setdaPath = public_path('images/logo/logo_setda.png');
        $logoKomdigi = is_file($komdigiPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($komdigiPath))
            : null;
        $logoSetda = is_file($setdaPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($setdaPath))
            : null;
        $issuedDate = ! empty($certificate?->issued_at)
            ? \Carbon\Carbon::parse($certificate->issued_at)->locale('id')->translatedFormat('d F Y')
            : \Carbon\Carbon::now()->locale('id')->translatedFormat('d F Y');
        $photoPath = $intern?->profile_photo_path ? storage_path('app/public/'.$intern->profile_photo_path) : null;
        $photoData = $photoPath && is_file($photoPath)
            ? 'data:'.(mime_content_type($photoPath) ?: 'image/jpeg').';base64,'.base64_encode(file_get_contents($photoPath))
            : null;
    @endphp
    <style>
        @page {
            size: A4 landscape;
            margin: 1.2cm 1.5cm 1cm;
        }

        html,
        body {
            margin: 0;
            padding: 0;
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            color: #172033;
            background: #fff;
        }

        * {
            box-sizing: border-box;
        }

        .certificate-container {
            position: relative;
            width: 267mm;
            height: 188mm;
            margin: 0 auto;
            padding: 7mm 12mm;
            overflow: hidden;
            border: 1.2mm solid #1d5b83;
            page-break-inside: avoid;
            page-break-after: avoid;
        }

        .recipient-photo { position: absolute; top: 0; left: 0; width: 25mm; height: 32mm; border: 0.4mm solid #1d5b83; object-fit: cover; }
        .photo-fallback { position: absolute; top: 0; left: 0; width: 25mm; height: 32mm; border: 0.4mm solid #1d5b83; background: #f1f5f9; color: #64748b; font-size: 7pt; line-height: 32mm; text-align: center; }
        .header-table td.logo-cell:first-child { padding-left: 29mm; }

        .certificate-container:before {
            position: absolute;
            top: 2.5mm;
            right: 2.5mm;
            bottom: 2.5mm;
            left: 2.5mm;
            border: 0.45mm solid #b58b43;
            content: "";
        }


        .content {
            position: relative;
            z-index: 1;
            width: 100%;
            height: 100%;
            text-align: center;
            page-break-inside: avoid;
        }

        table {
            border-collapse: collapse;
        }

        .header-table {
            width: 100%;
            height: 18mm;
            margin: 0 0 2mm;
        }

        .header-table td {
            vertical-align: middle;
        }

        .logo-cell {
            width: 17%;
        }

        .logo-img {
            max-width: 25mm;
            max-height: 15mm;
        }

        .agency-name {
            margin: 0;
            color: #173f63;
            font-size: 12pt;
            font-weight: bold;
            letter-spacing: 0.4pt;
            text-transform: uppercase;
        }

        .agency-region {
            margin-top: 1.2mm;
            color: #315d7d;
            font-size: 8.5pt;
            font-weight: bold;
            letter-spacing: 1.4pt;
            text-transform: uppercase;
        }

        .certificate-title {
            margin: 0.5mm 0 1mm;
            color: #1d5b83;
            font-size: 25pt;
            font-weight: bold;
            letter-spacing: 1.2pt;
            line-height: 1.05;
            text-transform: uppercase;
        }

        .certificate-number {
            margin: 0 0 2mm;
            color: #536579;
            font-size: 8pt;
            font-weight: bold;
            letter-spacing: 0.5pt;
        }

        .recipient-label {
            margin: 1mm 0 0;
            color: #536579;
            font-size: 10pt;
        }

        .intern-name {
            display: inline-block;
            max-width: 100%;
            margin: 2mm 0 1mm;
            padding: 0 8mm 1.5mm;
            border-bottom: 0.6mm solid #333;
            color: #172033;
            font-size: 23pt;
            font-weight: bold;
            line-height: 1.15;
            text-transform: uppercase;
        }

        .division-name {
            margin: 1mm 0 2mm;
            color: #1d5b83;
            font-size: 9.5pt;
            font-weight: bold;
            letter-spacing: 0.4pt;
        }

        .description {
            width: 92%;
            margin: 0 auto 3mm;
            color: #344256;
            font-size: 10pt;
            line-height: 1.45;
        }

        .signature-table {
            width: 100%;
            margin: 14mm 0 0;
            page-break-inside: avoid;
        }

        .signature-table td {
            width: 50%;
            padding: 0 8mm;
            text-align: center;
            vertical-align: top;
        }

        .signature-title {
            min-height: 8mm;
            color: #344256;
            font-size: 8.5pt;
            line-height: 1.35;
        }

        .signature-space {
            height: 70px;
        }

        .signer-name {
            color: #172033;
            font-size: 8.5pt;
            font-weight: bold;
            text-decoration: underline;
        }

        .signer-id {
            margin-top: 2mm;
            color: #536579;
            font-size: 7.5pt;
        }

        .footer-table {
            position: absolute;
            right: 0;
            bottom: 19mm;
            left: 0;
            width: 100%;
            margin: 0;
            border-top: 0.3mm solid #d5dee6;
            color: #536579;
            font-size: 7.5pt;
            table-layout: fixed;
            page-break-inside: avoid;
        }

        .footer-table td {
            padding: 1mm 1.5mm 0;
            vertical-align: middle;
            line-height: 1.2;
        }

        .verification-box {
            width: 40%;
            text-align: right;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-all;
            line-height: 1.2;
        }

        .qr-cell {
            width: 18mm;
            padding-left: 2mm;
            text-align: right;
            vertical-align: middle;
        }

        .qr-image {
            width: 15mm;
            height: 15mm;
        }

        .verification-hash {
            color: #173f63;
            font-size: 6.5pt;
            font-weight: bold;
            word-break: break-all;
            line-height: 1.2;
        }

        .verification-url {
            margin-top: 1mm;
            word-break: break-all;
            overflow-wrap: break-word;
            line-height: 1.2;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="content">
            @if ($photoData)
                <img src="{{ $photoData }}" class="recipient-photo" alt="Foto peserta">
            @else
                <div class="photo-fallback">FOTO PESERTA</div>
            @endif
            <table class="header-table">
                <tr>
                    <td class="logo-cell" style="text-align:left">
                        @if ($logoKomdigi)
                            <img src="{{ $logoKomdigi }}" class="logo-img" alt="Logo Komdigi">
                        @endif
                    </td>
                    <td style="width:66%;text-align:center">
                        <div class="agency-name">Dinas Komunikasi dan Informatika</div>
                        <div class="agency-region">Kabupaten Tabalong</div>
                    </td>
                    <td class="logo-cell" style="text-align:right">
                        @if ($logoSetda)
                            <img src="{{ $logoSetda }}" class="logo-img" alt="Logo Setda">
                        @endif
                    </td>
                </tr>
            </table>

            <div class="certificate-title">Sertifikat Magang</div>
            <div class="certificate-number">NOMOR: {{ $certificate->certificate_number ?? '-' }}</div>

            <div class="recipient-label">Dengan ini diberikan kepada:</div>
            <div class="intern-name">{{ $intern->name ?? 'Peserta Magang' }}</div>
            <div class="division-name">{{ $intern->division?->name ?? 'Dinas Komunikasi dan Informatika' }}</div>

            <div class="description">
                Atas partisipasi, dedikasi, dan keberhasilannya menyelesaikan program Praktik Kerja Lapangan / Magang
                di Dinas Komunikasi dan Informatika Kabupaten Tabalong.
            </div>

            <table class="signature-table">
                <tr>
                    <td>
                        <div class="signature-title">Pembimbing Lapangan / Mentor</div>
                        <div class="signature-space"></div>
                        <div class="signer-name">{{ $evaluation?->mentor?->name ?? 'Pembimbing Lapangan' }}</div>
                        <div class="signer-id">NIP. {{ $evaluation?->mentor?->nip ?? '-' }}</div>
                    </td>
                    <td>
                        <div class="signature-title">Tanjung, {{ $issuedDate }}<br>Kepala Dinas Komunikasi dan Informatika</div>
                        <div class="signature-space"></div>
                        <div class="signer-name">Eddy Suriyani, S.Sos., MA</div>
                        <div class="signer-id">NIP. 19741223 199403 1 004</div>
                    </td>
                </tr>
            </table>

            <table class="footer-table">
                <tr>
                    <td style="text-align:left">
                        <strong>Sertifikat digital resmi</strong><br>
                        Gunakan kode atau tautan berikut untuk verifikasi digital.
                    </td>
                    <td class="verification-box">
                        <div class="verification-hash">KODE VERIFIKASI: {{ $certificate->qr_hash ?? '-' }}</div>
                        <div class="verification-url">{{ $verify_url ?? '-' }}</div>
                    </td>
                    @if (! empty($qr_code_data_uri))
                        <td class="qr-cell">
                            <img src="{{ $qr_code_data_uri }}" class="qr-image" alt="QR verifikasi sertifikat">
                        </td>
                    @endif
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
