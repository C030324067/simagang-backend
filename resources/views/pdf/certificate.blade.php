<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Sertifikat Magang - {{ $intern->name ?? 'Peserta' }}</title>
    @php
        $tabalongPath = public_path('images/logo-tabalong.png');
        $diskominfoPath = public_path('images/logo/diskominfo.png');
        $logoTabalong = is_file($tabalongPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($tabalongPath))
            : null;
        $logoDiskominfo = is_file($diskominfoPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($diskominfoPath))
            : null;
        $watermark = $logoTabalong;
        $photoPath = $intern?->profile_photo_path ? storage_path('app/public/'.$intern->profile_photo_path) : null;
        $photoData = $photoPath && is_file($photoPath)
            ? 'data:'.(mime_content_type($photoPath) ?: 'image/jpeg').';base64,'.base64_encode(file_get_contents($photoPath))
            : null;
        $initials = collect(preg_split('/\s+/', trim((string) ($intern->name ?? 'Peserta'))))
            ->filter()
            ->take(2)
            ->map(fn ($part) => mb_substr($part, 0, 1))
            ->implode('');
        $isSmk = $education_level === 'SMK';
        $studentNumberLabel = $isSmk ? 'NISN' : 'NIM';
        $institutionLabel = $isSmk ? 'Sekolah' : 'Perguruan Tinggi';
        $institutionName = $application?->institution_name ?? '-';
        $major = $application?->major ?? '-';
        $issuedDateText = \Carbon\Carbon::parse($issued_date)->locale('id')->translatedFormat('d F Y');
        $startDateText = $application?->start_date
            ? \Carbon\Carbon::parse($application->start_date)->locale('id')->translatedFormat('d F Y')
            : '-';
        $endDateText = $application?->end_date
            ? \Carbon\Carbon::parse($application->end_date)->locale('id')->translatedFormat('d F Y')
            : '-';
        $technicalTotal = collect($technical_scores)->sum(fn ($item) => (float) ($item['score'] ?? 0));
        $skillTotal = collect($skill_scores)->sum(fn ($item) => (float) ($item['score'] ?? 0));
    @endphp
    <style>
        @page {
            size: A4 landscape;
            margin: 7mm;
        }

        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            color: #172033;
            background: #fff;
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
        }
        .page {
            position: relative;
            width: auto;
            height: 176mm;
            margin: 0 auto;
            padding: 8mm 10mm;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .certificate-page {
            border: 1.1mm solid #1e3a8a;
            page-break-after: always;
        }
        .certificate-page:before {
            position: absolute;
            z-index: 0;
            top: 2mm;
            right: 2mm;
            bottom: 2mm;
            left: 2mm;
            border: .35mm solid #c9a45c;
            content: "";
        }
        .watermark {
            position: absolute;
            top: 46mm;
            left: 105mm;
            width: 70mm;
            height: 70mm;
            opacity: .055;
        }
        .page-content { position: relative; z-index: 1; }
        table { border-collapse: collapse; }
        .letterhead { width: 100%; height: 20mm; }
        .letterhead td { vertical-align: middle; }
        .letterhead-logo { width: 22mm; text-align: center; }
        .letterhead-logo img { width: 17mm; height: 17mm; }
        .letterhead-diskominfo { width: 25mm; text-align: center; }
        .letterhead-diskominfo img { max-width: 22mm; max-height: 15mm; }
        .government { margin: 0; font-size: 10pt; font-weight: bold; letter-spacing: .45pt; }
        .department { margin: 1mm 0; color: #1e3a8a; font-size: 12pt; font-weight: bold; letter-spacing: .5pt; }
        .address, .contact { margin: .5mm 0 0; color: #475569; font-size: 6.5pt; }
        .gold-divider { height: .6mm; margin: 1mm 0 3mm; background: #c9a45c; }
        .certificate-title { margin: 1mm 0 0; color: #1e3a8a; font-size: 23pt; font-weight: bold; letter-spacing: 2pt; text-align: center; }
        .certificate-number { margin: 1mm 0 2mm; color: #475569; font-size: 8.5pt; font-weight: bold; text-align: center; }
        .recipient-layout { width: 100%; margin-top: 2mm; }
        .photo-cell { width: 42mm; padding: 2mm 7mm 2mm 1mm; text-align: center; vertical-align: middle; }
        .photo-frame { width: 30mm; height: 40mm; margin: 0 auto; border: .6mm solid #1e3a8a; background: #f1f5f9; }
        .recipient-photo { width: 29mm; height: 39mm; object-fit: cover; }
        .photo-initials { color: #1e3a8a; font-size: 22pt; font-weight: bold; line-height: 39mm; }
        .photo-caption { margin-top: 1.5mm; color: #64748b; font-size: 6pt; }
        .recipient-info { vertical-align: middle; }
        .recipient-label { margin: 0 0 1.5mm; color: #475569; font-size: 9pt; }
        .biodata { width: 100%; font-size: 9pt; }
        .biodata td { padding: 1.4mm 1mm; vertical-align: top; }
        .biodata .label { width: 31mm; color: #475569; }
        .biodata .colon { width: 5mm; text-align: center; }
        .intern-name { color: #172033; font-size: 13pt; font-weight: bold; text-transform: uppercase; }
        .description { width: 85%; margin: 3mm auto 2mm; color: #334155; font-size: 8.5pt; line-height: 1.45; text-align: center; }
        .result-badge { width: 75mm; margin: 0 auto; padding: 2mm 4mm; border: .4mm solid #c9a45c; border-radius: 2mm; background: #fffbeb; color: #1e3a8a; font-size: 12pt; font-weight: bold; letter-spacing: 1pt; text-align: center; }
        .signature-kadis { position: absolute; right: 13mm; bottom: 9mm; width: 76mm; text-align: center; }
        .signature-kadis .caption { font-size: 7.5pt; line-height: 1.35; }
        .signature-space { height: 16mm; }
        .signature-name { font-size: 8pt; font-weight: bold; text-decoration: underline; }
        .signature-title { margin-top: 1mm; font-size: 7pt; }
        .qr-block { position: absolute; bottom: 8mm; left: 12mm; width: 53mm; text-align: center; }
        .qr-block img { width: 17mm; height: 17mm; }
        .qr-label { margin-top: 1mm; color: #475569; font-size: 5.5pt; }
        .transcript-page { padding: 7mm 9mm; }
        .transcript-header { padding-bottom: 2mm; border-bottom: .6mm solid #1e3a8a; }
        .transcript-title { margin: 0 0 1mm; color: #1e3a8a; font-size: 17pt; font-weight: bold; letter-spacing: 1pt; text-align: center; }
        .transcript-number { margin: 0; color: #475569; font-size: 7pt; text-align: center; }
        .transcript-biodata { width: 100%; margin: 2mm 0; font-size: 7pt; }
        .transcript-biodata td { padding: 1mm 1.5mm; }
        .transcript-biodata .label { color: #64748b; }
        .section-title { margin: 1.8mm 0 .8mm; color: #1e3a8a; font-size: 7.5pt; font-weight: bold; }
        .score-table { width: 100%; font-size: 7pt; }
        .score-table th, .score-table td { padding: 1.05mm 1.5mm; border: .25mm solid #cbd5e1; }
        .score-table th { background: #eff6ff; color: #1e3a8a; font-size: 6.5pt; text-align: left; }
        .score-table .number { width: 12mm; text-align: center; }
        .score-table .score { width: 25mm; text-align: center; }
        .score-table .total-row { background: #f8fafc; font-weight: bold; }
        .summary { margin: 2mm 0; padding: 2mm 3mm; border: .3mm solid #bbf7d0; background: #f0fdf4; color: #14532d; font-size: 8pt; font-weight: bold; }
        .bottom-layout { width: 100%; margin-top: 2mm; }
        .bottom-layout td { width: 50%; vertical-align: top; }
        .scale-table { width: 92%; font-size: 6pt; }
        .scale-table th, .scale-table td { padding: 1mm 1.5mm; border: .25mm solid #cbd5e1; }
        .scale-table th { background: #f1f5f9; text-align: left; }
        .mentor-signature { padding-left: 12mm; text-align: center; font-size: 7pt; }
        .mentor-signature .role { min-height: 8mm; }
        .mentor-signature .space { height: 12mm; }
        .mentor-signature .name { font-weight: bold; text-decoration: underline; text-transform: uppercase; }
        .page-count { position: absolute; right: 9mm; bottom: 4mm; color: #64748b; font-size: 5.5pt; }
    </style>
</head>
<body>
    <section class="page certificate-page">
        @if ($watermark)
            <img class="watermark" src="{{ $watermark }}" alt="">
        @endif
        <div class="page-content">
            <table class="letterhead">
                <tr>
                    <td class="letterhead-logo">
                        @if ($logoTabalong)<img src="{{ $logoTabalong }}" alt="Logo Kabupaten Tabalong">@endif
                    </td>
                    <td style="text-align:center">
                        <p class="government">PEMERINTAH KABUPATEN TABALONG</p>
                        <p class="department">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                        <p class="address">Jl. Cempaka No. 38 Tanjung, Tabalong, Kalimantan Selatan 71513</p>
                        <p class="contact">Telepon (0526) 2023169 · diskominfo.tabalongkab.go.id · diskominfo@tabalongkab.go.id</p>
                    </td>
                    <td class="letterhead-diskominfo">
                        @if ($logoDiskominfo)<img src="{{ $logoDiskominfo }}" alt="Logo Diskominfo">@endif
                    </td>
                </tr>
            </table>
            <div class="gold-divider"></div>
            <h1 class="certificate-title">SERTIFIKAT</h1>
            <p class="certificate-number">Nomor : {{ $certificate->certificate_number ?? '-' }}</p>

            <table class="recipient-layout">
                <tr>
                    <td class="photo-cell">
                        <div class="photo-frame">
                            @if ($photoData)
                                <img src="{{ $photoData }}" class="recipient-photo" alt="Pas foto peserta">
                            @else
                                <div class="photo-initials">{{ $initials }}</div>
                            @endif
                        </div>
                        <p class="photo-caption">PAS FOTO PESERTA SIMAGANG</p>
                    </td>
                    <td class="recipient-info">
                        <p class="recipient-label">Diberikan kepada:</p>
                        <table class="biodata">
                            <tr><td class="label">Nama</td><td class="colon">:</td><td class="intern-name">{{ $intern->name ?? 'Peserta Magang' }}</td></tr>
                            <tr><td class="label">{{ $studentNumberLabel }}</td><td class="colon">:</td><td>{{ $application?->student_number ?? '-' }}</td></tr>
                            <tr><td class="label">Jurusan</td><td class="colon">:</td><td>{{ $major }}</td></tr>
                            <tr><td class="label">{{ $institutionLabel }}</td><td class="colon">:</td><td>{{ $institutionName }}</td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p class="description">
                Telah mengikuti {{ $isSmk ? 'praktik kerja lapangan (PKL)' : 'program magang' }}
                selama {{ $duration_months }} bulan terhitung dari tanggal {{ $startDateText }} s/d {{ $endDateText }}
                dengan hasil:
            </p>
            <div class="result-badge">{{ $grade_description }}</div>
        </div>

        <div class="qr-block">
            @if (! empty($qr_code_data_uri))
                <img src="{{ $qr_code_data_uri }}" alt="QR verifikasi sertifikat">
            @endif
            <p class="qr-label">Pindai untuk verifikasi sertifikat digital</p>
        </div>
        <div class="signature-kadis">
            <div class="caption">Tanjung, {{ $issuedDateText }}<br>Kepala Dinas Komunikasi dan Informatika,</div>
            <div class="signature-space"></div>
            <div class="signature-name">Eddy Suryani, S.Sos, MA</div>
            <div class="signature-title">Pembina Tk. I/(IV/b)<br>NIP 197412231994031004</div>
        </div>
        <p class="page-count">Halaman 1 dari 2</p>
    </section>

    <section class="page transcript-page">
        <h1 class="transcript-title">DAFTAR NILAI</h1>
        <p class="transcript-number">Nomor Sertifikat: {{ $certificate->certificate_number ?? '-' }}</p>
        <table class="transcript-biodata">
            <tr>
                <td class="label">Nama</td><td><strong>{{ $intern->name ?? '-' }}</strong></td>
                <td class="label">{{ $studentNumberLabel }}</td><td>{{ $application?->student_number ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Jurusan</td><td>{{ $major }}</td>
                <td class="label">{{ $institutionLabel }}</td><td>{{ $institutionName }}</td>
            </tr>
        </table>

        @if ($isSmk)
            <p class="section-title">A. NILAI TEKNIS</p>
            <table class="score-table">
                <thead><tr><th class="number">NO.</th><th>KRITERIA PENILAIAN</th><th class="score">NILAI</th></tr></thead>
                <tbody>
                    @foreach ($technical_scores as $index => $item)
                        <tr><td class="number">{{ $index + 1 }}</td><td>{{ $item['criteria'] ?? 'Aspek Teknis' }}</td><td class="score">{{ number_format((float) ($item['score'] ?? 0), 2) }}</td></tr>
                    @endforeach
                    <tr class="total-row"><td colspan="2">Jumlah Nilai Teknis</td><td class="score">{{ number_format($technicalTotal, 2) }}</td></tr>
                </tbody>
            </table>
            <p class="section-title">B. KETERAMPILAN (PENILAIAN TETAP DISKOMINFO)</p>
        @else
            <p class="section-title">PENILAIAN KETERAMPILAN (STANDAR DISKOMINFO)</p>
        @endif

        <table class="score-table">
            <thead><tr><th class="number">NO.</th><th>KRITERIA PENILAIAN</th><th class="score">NILAI</th></tr></thead>
            <tbody>
                @foreach ($skill_scores as $index => $item)
                    <tr><td class="number">{{ $index + 1 }}</td><td>{{ $item['criteria'] }}</td><td class="score">{{ is_numeric($item['score']) ? number_format((float) $item['score'], 2) : '—' }}</td></tr>
                @endforeach
                <tr class="total-row"><td colspan="2">Jumlah Nilai Keterampilan</td><td class="score">{{ number_format($skillTotal, 2) }}</td></tr>
            </tbody>
        </table>

        <div class="summary">
            Nilai Akhir: {{ number_format((float) ($evaluation?->final_score ?? 0), 2) }} ({{ $grade_letter }})
            <span style="padding-left:12mm">Sebutan: {{ $grade_description }}</span>
        </div>

        <table class="bottom-layout">
            <tr>
                <td>
                    <p class="section-title">KETERANGAN NILAI</p>
                    <table class="scale-table">
                        <thead><tr><th>RENTANG</th><th>MUTU</th><th>SEBUTAN</th></tr></thead>
                        <tbody>
                            <tr><td>90 - 100</td><td>A</td><td>SANGAT BAIK</td></tr>
                            <tr><td>75 - 89</td><td>B</td><td>BAIK</td></tr>
                            <tr><td>60 - 74</td><td>C</td><td>CUKUP</td></tr>
                            <tr><td>00 - 59</td><td>D</td><td>KURANG</td></tr>
                        </tbody>
                    </table>
                </td>
                <td class="mentor-signature">
                    <div class="role">Tanjung, {{ $issuedDateText }}<br>{{ $mentor_position ?: 'Pembimbing Lapangan,' }}</div>
                    <div class="space"></div>
                    <div class="name">{{ $evaluation?->mentor?->name ?? 'PEMBIMBING LAPANGAN' }}</div>
                    <div>NIP {{ $mentor_nip ?: '-' }}</div>
                </td>
            </tr>
        </table>
        <p class="page-count">Halaman 2 dari 2</p>
    </section>
</body>
</html>
