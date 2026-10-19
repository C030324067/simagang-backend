<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Sertifikat Magang - {{ $intern->name ?? 'Peserta' }}</title>
    @php
        $komdigiPath = public_path('images/logo/logo komdigi.png');
        $setdaPath = public_path('images/logo/logo_setda.png');

        $logoKomdigi = (file_exists($komdigiPath) && is_file($komdigiPath)) ? 'data:image/png;base64,' . base64_encode(file_get_contents($komdigiPath)) : null;
        $logoSetda = (file_exists($setdaPath) && is_file($setdaPath)) ? 'data:image/png;base64,' . base64_encode(file_get_contents($setdaPath)) : null;

        $issuedDate = isset($certificate->issued_at) ? \Carbon\Carbon::parse($certificate->issued_at)->locale('id')->translatedFormat('d F Y') : \Carbon\Carbon::now()->locale('id')->translatedFormat('d F Y');
    @endphp
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

        /* Bingkai Luar & Dalam */
        .page-container {
            position: absolute;
            top: 15px;
            bottom: 15px;
            left: 15px;
            right: 15px;
            border: 4px solid #0284c7;
            padding: 6px;
            box-sizing: border-box;
        }
        .cert-inner-border {
            border: 2px double #1e3a8a;
            padding: 25px 40px;
            height: 100%;
            box-sizing: border-box;
            text-align: center;
            position: relative;
        }

        /* Header Logo Kiri - Tengah - Kanan */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo-img {
            max-height: 85px;
            width: auto;
        }
        .header-title {
            font-size: 24px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
        }
        .header-sub {
            font-size: 15px;
            font-weight: bold;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-top: 5px;
        }

        /* Judul Sertifikat & Nomor */
        .cert-title {
            font-size: 34px;
            font-weight: 900;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 10px;
            margin-bottom: 5px;
        }
        .cert-number {
            font-size: 14px;
            font-weight: bold;
            color: #475569;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }

        .recipient-label {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 8px;
        }

        /* Nama Peserta (Ukuran Ekstra Besar) */
        .intern-name {
            font-size: 48px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin: 10px auto;
            display: inline-block;
            border-bottom: 4px solid #0284c7;
            padding-bottom: 6px;
            letter-spacing: 2px;
        }

        .division-badge {
            font-size: 16px;
            font-weight: bold;
            color: #0369a1;
            background-color: #e0f2fe;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            display: inline-block;
            padding: 6px 22px;
            margin-top: 12px;
            margin-bottom: 18px;
        }

        .description {
            font-size: 14px;
            line-height: 1.7;
            color: #334155;
            width: 88%;
            margin: 0 auto 20px auto;
        }

        /* Box Nilai Akhir */
        .score-box {
            background-color: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px 24px;
            margin: 0 auto 25px auto;
            width: 85%;
        }
        .final-score {
            font-size: 17px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 6px;
        }
        .score-badge {
            color: #0284c7;
            font-size: 22px;
        }
        .score-table {
            width: 100%;
            font-size: 13px;
            color: #334155;
            border-collapse: collapse;
        }
        .score-table td {
            padding: 4px 8px;
        }

        /* Block Tanda Tangan Mentok Di Bawah */
        .ttd-table {
            position: absolute;
            bottom: 45px;
            left: 40px;
            right: 40px;
            width: calc(100% - 80px);
            border-collapse: collapse;
        }
        .ttd-title {
            font-size: 14px;
            color: #334155;
            line-height: 1.4;
        }
        .ttd-space {
            height: 65px; /* Ruang untuk tanda tangan fisik / stempel */
        }
        .ttd-name {
            font-size: 15px;
            font-weight: bold;
            color: #0f172a;
            text-decoration: underline;
        }
        .ttd-nip {
            font-size: 12px;
            color: #64748b;
            margin-top: 3px;
        }

        /* Footer Verifikasi */
        .footer-table {
            position: absolute;
            bottom: 12px;
            left: 40px;
            right: 40px;
            width: calc(100% - 80px);
            font-size: 10px;
            color: #64748b;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <div class="cert-inner-border">
            
            <!-- Header Logo & Instansi -->
            <table class="header-table">
                <tr>
                    <td style="width: 20%; text-align: left;">
                        @if($logoKomdigi)
                            <img src="{{ $logoKomdigi }}" class="logo-img" alt="Logo Komdigi">
                        @endif
                    </td>
                    <td style="width: 60%; text-align: center;">
                        <div class="header-title">Dinas Komunikasi dan Informatika</div>
                        <div class="header-sub">Kabupaten Tabalong</div>
                    </td>
                    <td style="width: 20%; text-align: right;">
                        @if($logoSetda)
                            <img src="{{ $logoSetda }}" class="logo-img" alt="Logo Setda">
                        @endif
                    </td>
                </tr>
            </table>

            <!-- Judul & Nomor Sertifikat -->
            <div class="cert-title">SERTIFIKAT KELULUSAN MAGANG</div>
            <div class="cert-number">NOMOR: {{ $certificate->certificate_number ?? '-' }}</div>

            <div class="recipient-label">Sertifikat ini diberikan secara resmi kepada:</div>
            
            <!-- Nama Peserta -->
            <div class="intern-name">{{ $intern->name ?? 'Peserta' }}</div>
            <br>
            <div class="division-badge">
                {{ $intern->division?->name ?? 'Dinas Komunikasi dan Informatika' }}
            </div>

            <!-- Deskripsi -->
            <div class="description">
                Atas partisipasi, dedikasi, dan keberhasilannya dalam menyelesaikan seluruh rangkaian program Praktik Kerja Lapangan / Magang di Dinas Komunikasi dan Informatika Kabupaten Tabalong.
            </div>

            <!-- Box Nilai Akhir -->
            <div class="score-box">
                <div class="final-score">
                    Nilai Akhir (Final Score): 
                    <span class="score-badge">{{ number_format($evaluation->final_score ?? 0, 2) }} / 100</span>
                </div>
                
                @if($evaluation)
                <table class="score-table">
                    <tr>
                        <td style="text-align: center; width: 33%;">Kehadiran & Disiplin: <b>{{ number_format($evaluation->discipline_score ?? 0, 2) }}</b></td>
                        <td style="text-align: center; width: 34%;">Tugas & Logbook: <b>{{ number_format($evaluation->skill_score ?? 0, 2) }}</b></td>
                        <td style="text-align: center; width: 33%;">Softskill & Sikap: <b>{{ number_format($evaluation->softskill_score ?? 0, 2) }}</b></td>
                    </tr>
                </table>
                @endif
            </div>

            <!-- Blok Tanda Tangan Mentok Di Bawah -->
            <table class="ttd-table">
                <tr>
                    <td style="width: 50%; text-align: center; vertical-align: top;">
                        <div class="ttd-title">Pembimbing Lapangan Magang</div>
                        <div class="ttd-space"></div>
                        <div class="ttd-name">{{ $evaluation?->mentor?->name ?? 'Pembimbing Lapangan' }}</div>
                        <div class="ttd-nip">NIP. {{ $evaluation?->mentor?->nip ?? '-' }}</div>
                    </td>
                    <td style="width: 50%; text-align: center; vertical-align: top;">
                        <div class="ttd-title">
                            Tanjung, {{ $issuedDate }}<br>
                            Kepala Dinas Kominfo
                        </div>
                        <div class="ttd-space"></div>
                        <div class="ttd-name">H. HM. NORNAHAR, S.STP., M.Si.</div>
                        <div class="ttd-nip">Pembina Utama Muda (IV/c)</div>
                    </td>
                </tr>
            </table>

            <!-- Footer Keaslian Digital -->
            <table class="footer-table">
                <tr>
                    <td style="width: 60%; text-align: left;">
                        <b>Verifikasi Keaslian Digital:</b> {{ $verify_url ?? '-' }}
                    </td>
                    <td style="width: 40%; text-align: right;">
                        Sertifikat Sah Diterbitkan Oleh Diskominfo Tabalong
                    </td>
                </tr>
            </table>

        </div>
    </div>
</body>
</html>