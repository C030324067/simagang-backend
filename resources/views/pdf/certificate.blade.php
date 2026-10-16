<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Sertifikat Magang - {{ $intern->name }}</title>
    <style>
        @page {
            margin: 0;
            size: A4 landscape;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 30px;
            background-color: #ffffff;
            color: #1e293b;
        }
        .container {
            border: 8px double #2563eb;
            padding: 40px;
            text-align: center;
            box-sizing: border-box;
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }
        .sub-header {
            font-size: 13px;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 22px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 10px;
        }
        .recipient-label {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 10px;
        }
        .name {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            text-transform: uppercase;
            margin: 15px 0;
            border-bottom: 2px solid #cbd5e1;
            display: inline-block;
            padding-bottom: 5px;
        }
        .description {
            font-size: 13px;
            line-height: 1.6;
            color: #334155;
            max-width: 700px;
            margin: 20px auto;
        }
        .footer-table {
            width: 100%;
            margin-top: 40px;
            font-size: 11px;
            text-align: left;
        }
        .cert-number {
            font-family: monospace;
            font-weight: bold;
            color: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Dinas Komunikasi dan Informatika</div>
        <div class="sub-header">Kabupaten Tabalong</div>
        
        <div class="title">SERTIFIKAT KELULUSAN MAGANG</div>
        <div class="recipient-label">Diberikan secara resmi kepada:</div>
        
        <div class="name">{{ $intern->name }}</div>
        
        <div class="description">
            Atas dedikasi dan keberhasilannya dalam menyelesaikan seluruh rangkaian kegiatan Praktik Kerja Lapangan / Magang pada unit kerja 
            <b>{{ $intern->division->name ?? 'Dinas Komunikasi dan Informatika' }}</b>.
        </div>

        <table class="footer-table">
            <tr>
                <td style="width: 50%;">
                    <b>Nomor Sertifikat:</b> <span class="cert-number">{{ $certificate->certificate_number }}</span><br>
                    <b>Tanggal Terbit:</b> {{ \Carbon\Carbon::parse($certificate->issued_at)->translatedFormat('d F Y') }}
                </td>
                <td style="width: 50%; text-align: right;">
                    <b>Verifikasi Keaslian Digital:</b><br>
                    <span style="color: #64748b; font-size: 10px;">{{ $verify_url }}</span>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>