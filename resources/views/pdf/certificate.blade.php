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
    @endphp
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }

        html,
        body {
            width: 297mm;
            height: 210mm;
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
            /* Sisakan ruang untuk padding/border yang dihitung di luar ukuran oleh DomPDF. */
            width: 258mm;
            height: 183mm;
            margin: 0 auto;
            padding: 12mm 18mm;
            overflow: hidden;
            border: 1.2mm solid #1d5b83;
            page-break-inside: avoid;
            page-break-after: always;
        }

        .transcript-page {
            width: 258mm;
            min-height: 183mm;
            margin: 0 auto;
            padding: 14mm 18mm;
            border: 1.2mm solid #1d5b83;
            page-break-after: avoid;
        }

        .transcript-page h1 { color: #1d5b83; text-align: center; font-size: 22pt; }
        .transcript-page p { text-align: center; }
        .transcript-table { width: 100%; margin-top: 12mm; border-collapse: collapse; font-size: 11pt; }
        .transcript-table th, .transcript-table td { border: 1px solid #64748b; padding: 3mm; }

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
            height: auto;
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
            width: 18%;
        }

        .logo-img {
            max-width: 28mm;
            max-height: 17mm;
        }

        .agency-name {
            margin: 0;
            color: #173f63;
            font-size: 15pt;
            font-weight: bold;
            letter-spacing: 0.4pt;
            text-transform: uppercase;
        }

        .agency-region {
            margin-top: 1.2mm;
            color: #315d7d;
            font-size: 10pt;
            font-weight: bold;
            letter-spacing: 1.4pt;
            text-transform: uppercase;
        }

        .certificate-title {
            margin: 0.5mm 0 1mm;
            color: #1d5b83;
            font-size: 30pt;
            font-weight: bold;
            letter-spacing: 1.2pt;
            line-height: 1.05;
            text-transform: uppercase;
        }

        .certificate-number {
            margin: 0 0 2mm;
            color: #536579;
            font-size: 9pt;
            font-weight: bold;
            letter-spacing: 0.5pt;
        }

        .recipient-label {
            margin: 1mm 0 0;
            color: #536579;
            font-size: 12pt;
        }

        .intern-name {
            display: inline-block;
            max-width: 100%;
            margin: 2mm 0 1mm;
            padding: 0 8mm 1.5mm;
            border-bottom: 0.6mm solid #333;
            color: #172033;
            font-size: 28pt;
            font-weight: bold;
            line-height: 1.15;
            text-transform: uppercase;
        }

        .division-name {
            margin: 1mm 0 2mm;
            color: #1d5b83;
            font-size: 11pt;
            font-weight: bold;
            letter-spacing: 0.4pt;
        }

        .description {
            width: 92%;
            margin: 0 auto 3mm;
            color: #344256;
            font-size: 12pt;
            line-height: 1.45;
        }

        .evaluation-block {
            width: 100%;
            margin: 2mm 0 3mm;
            page-break-inside: avoid;
        }

        .final-score {
            margin: 0;
            padding: 2mm 3mm;
            border: 0.35mm solid #b8c8d5;
            border-bottom: 0;
            background: #edf4f8;
            color: #173f63;
            font-size: 13pt;
            font-weight: bold;
        }

        .final-score-value {
            color: #a47625;
            font-size: 16pt;
        }

        .score-table {
            width: 100%;
            margin: 0;
            border: 0.35mm solid #b8c8d5;
            color: #26384a;
            font-size: 11pt;
        }

        .score-table td {
            width: 25%;
            padding: 2.2mm 3mm;
            border: 0.25mm solid #cbd6df;
            vertical-align: middle;
        }

        .score-label {
            display: block;
            margin-bottom: 1mm;
            color: #536579;
            font-size: 8.5pt;
        }

        .score-value {
            color: #173f63;
            font-size: 13pt;
            font-weight: bold;
        }

        .grade-line {
            margin-top: 1.5mm;
            color: #536579;
            font-size: 10pt;
        }

        .signature-table {
            width: 100%;
            margin: 2mm 0 0;
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
            font-size: 10pt;
            line-height: 1.35;
        }

        .signature-space {
            height: 34px;
        }

        .signer-name {
            color: #172033;
            font-size: 10pt;
            font-weight: bold;
            text-decoration: underline;
        }

        .signer-id {
            margin-top: 1mm;
            color: #536579;
            font-size: 8.5pt;
        }

        .footer-table {
            width: 100%;
            margin: 2mm 0 0;
            border-top: 0.3mm solid #d5dee6;
            color: #536579;
            font-size: 7.5pt;
            table-layout: fixed;
            page-break-inside: avoid;
        }

        .footer-table td {
            padding-top: 1.5mm;
            vertical-align: middle;
        }

        .verification-box {
            width: 60mm;
            text-align: right;
            word-wrap: break-word;
        }

        .qr-cell {
            width: 22mm;
            padding-left: 3mm;
            text-align: right;
            vertical-align: middle;
        }

        .qr-image {
            width: 19mm;
            height: 19mm;
        }

        .verification-hash {
            color: #173f63;
            font-size: 7pt;
            font-weight: bold;
            word-break: break-all;
        }

        .verification-url {
            margin-top: 0.8mm;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="content">
            <table class="header-table">
                <tr>
                    <td class="logo-cell" style="text-align:left">
                        @if ($logoKomdigi)
                            <img src="{{ $logoKomdigi }}" class="logo-img" alt="Logo Komdigi">
                        @endif
                    </td>
                    <td style="width:64%;text-align:center">
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

            <div class="evaluation-block">
                <div class="final-score">
                    NILAI AKHIR&nbsp;&nbsp;
                    <span class="final-score-value">{{ number_format((float) ($evaluation?->final_score ?? 0), 2) }}</span>
                    <span style="font-size:10pt;font-weight:normal"> / 100</span>
                </div>
                <table class="score-table">
                    <tr>
                        <td>
                            <span class="score-label">Disiplin</span>
                            <span class="score-value">{{ number_format((float) ($evaluation?->score_discipline ?? 0), 2) }}</span>
                        </td>
                        <td>
                            <span class="score-label">Kualitas Kerja</span>
                            <span class="score-value">{{ number_format((float) ($evaluation?->score_quality ?? 0), 2) }}</span>
                        </td>
                        <td>
                            <span class="score-label">Softskill</span>
                            <span class="score-value">{{ number_format((float) ($evaluation?->score_softskill ?? 0), 2) }}</span>
                        </td>
                        <td>
                            <span class="score-label">Tanggung Jawab</span>
                            <span class="score-value">{{ number_format((float) ($evaluation?->score_responsibility ?? 0), 2) }}</span>
                        </td>
                    </tr>
                </table>
                <div class="grade-line">Predikat: <strong>{{ $evaluation?->grade_letter ?? '-' }}</strong></div>
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
    <section class="transcript-page">
        <h1>Transkrip / Daftar Nilai</h1>
        <p>{{ $intern->name ?? 'Peserta Magang' }} · Jenjang {{ $education_level ?? 'Kuliah' }}</p>
        <table class="transcript-table">
            <thead><tr><th>No.</th><th>Aspek Penilaian</th><th>Nilai</th><th>Catatan</th></tr></thead>
            <tbody>
                @forelse ($transcript_scores ?? [] as $score)
                    <tr><td>{{ $loop->iteration }}</td><td>{{ $score->aspek }}</td><td>{{ number_format((float) $score->nilai, 2) }}</td><td>{{ $score->catatan ?: '—' }}</td></tr>
                @empty
                    <tr><td colspan="4" style="text-align:center">Belum ada rincian nilai.</td></tr>
                @endforelse
            </tbody>
        </table>
        <p style="margin-top:8mm;text-align:right">Nilai Akhir: <strong>{{ number_format((float) ($evaluation?->final_score ?? 0), 2) }} / 100</strong></p>
    </section>
</body>
</html>
