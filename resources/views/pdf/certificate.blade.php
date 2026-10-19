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
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: 'Helvetica', 'Arial', sans-serif;
            background-color: #ffffff;
            color: #0f172a;
        }
        
        /* Bingkai Utama Memenuhi Seluruh Halaman A4 Landscape */
        .cert-border {
            position: absolute;
            top: 20px;
            bottom: 20px;
            left: 20px;
            right: 20px;
            border: 6px double #1e40af;
            padding: 35px 45px;
            box-sizing: border-box;
            text-align: center;
        }

        .header-title {
            font-size: 26px;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 6px;
        }
        .header-sub {
            font-size: 14px;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-bottom: 30px;
        }

        .cert-title {
            font-size: 24px;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .cert-subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 12px;
        }

        .intern-name {
            font-size: 38px;
            font-weight: bold;
            color: #1d4ed8;
            text-transform: uppercase;
            margin: 15px auto;
            display: inline-block;
            border-bottom: 3px solid #93c5fd;
            padding-bottom: 6px;
            letter-spacing: 1px;
        }

        .description {
            font-size: 14px;
            line-height: 1.7;
            color: #334155;
            width: 88%;
            margin: 15px auto 25px auto;
        }

        /* Box Nilai Akhir & Detail Breakdown */
        .score-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 15px 25px;
            margin: 0 auto;
            width: 85%;
        }
        .final-score {
            font-size: 17px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 10px;
        }
        .score-badge {
            color: #1d4ed8;
            font-size: 22px;
        }
        .score-table {
            width: 100%;
            font-size: 12px;
            color: #334155;
            border-collapse: collapse;
            margin-top: 5px;
        }
        .score-table td {
            padding: 4px 8px;
        }

        /* Footer Informasi di Bagian Bawah Bingkai */
        .footer-table {
            position: absolute;
            bottom: 30px;
            left: 45px;
            right: 45px;
            width: calc(100% - 90px);
            font-size: 11px;
            color: #334155;
            text-align: left;
        }
        .cert-number {
            font-family: monospace;
            font-weight: bold;
            color: #1d4ed8;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="cert-border">
        <!-- Header Instansi -->
        <div class="header-title">DINAS KOMUNIKASI DAN INFORMATIKA</div>
        <div class="header-sub">KABUPATEN TABALONG</div>
        
        <!-- Judul Sertifikat -->
        <div class="cert-title">SERTIFIKAT KELULUSAN MAGANG</div>
        <div class="cert-subtitle">Diberikan secara resmi kepada:</div>
        
        <!-- Nama Peserta Magang -->
        <div class="intern-name">{{ $intern->name }}</div>
        
        <!-- Keterangan -->
        <div class="description">
            Atas dedikasi dan keberhasilannya dalam menyelesaikan seluruh rangkaian kegiatan Praktik Kerja Lapangan / Magang pada unit kerja 
            <b>{{ $intern->division->name ?? 'Dinas Komunikasi dan Informatika' }}</b>.
        </div>

        <!-- Section Nilai Akhir (Final Score) -->
        <div class="score-box">
            <div class="final-score">
                Nilai Akhir (Final Score): 
                <span class="score-badge">{{ number_format($evaluation->final_score ?? 0, 2) }} / 100</span>
            </div>
            
            @if($evaluation)
            <table class="score-table">
                <tr>
                    <td style="text-align: center; width: 33%;">Kedisiplinan & Kehadiran: <b>{{ number_format($evaluation->discipline_score ?? 0, 2) }}</b></td>
                    <td style="text-align: center; width: 34%;">Tugas & Logbook Kegiatan: <b>{{ number_format($evaluation->skill_score ?? 0, 2) }}</b></td>
                    <td style="text-align: center; width: 33%;">Softskill & Sikap: <b>{{ number_format($evaluation->softskill_score ?? 0, 2) }}</b></td>
                </tr>
            </table>
            @endif
        </div>

        <!-- Footer Info & Verifikasi -->
        <table class="footer-table">
            <tr>
                <td style="width: 50%; vertical-align: bottom;">
                    <b>Nomor Sertifikat:</b> <span class="cert-number">{{ $certificate->certificate_number }}</span><br>
                    <b>Tanggal Terbit:</b> {{ \Carbon\Carbon::parse($certificate->issued_at)->translatedFormat('d F Y') }}
                </td>
                <td style="width: 50%; text-align: right; vertical-align: bottom;">
                    <b>Verifikasi Keaslian Digital:</b><br>
                    <span style="color: #64748b; font-size: 10px;">{{ $verify_url }}</span>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>