<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Sertifikat Magang - {{ $intern->name ?? 'Peserta' }}</title>
    @php
        $tabalongPath = public_path('images/logo-tabalong.png');
        $diskominfoPath = public_path('images/logo/diskominfo.png');$canvaBgPath = public_path('images/template-sertifikat.png');

        $logoTabalong = is_file($tabalongPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($tabalongPath))
            : null;
        $logoDiskominfo = is_file($diskominfoPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($diskominfoPath))
            : null;
        $canvaBg = is_file($canvaBgPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($canvaBgPath))
            : null;

        $watermark =$logoTabalong;
        $photoPath = $intern?->profile_photo_path ? storage_path('app/public/'.$intern->profile_photo_path) : null;
        $photoData = $photoPath && is_file($photoPath)
            ? 'data:'.(mime_content_type($photoPath) ?: 'image/jpeg').';base64,'.base64_encode(file_get_contents($photoPath))
            : null;

        $initials = collect(preg_split('/\s+/', trim((string) ($intern->name ?? 'Peserta'))))
            ->filter()
            ->take(2)
            ->map(fn ($part) => mb_substr($part, 0, 1))
            ->implode('');

        $isSmk =$education_level === 'SMK';
        $studentNumberLabel =$isSmk ? 'NISN' : 'NIM';
        $institutionLabel =$isSmk ? 'Sekolah' : 'Perguruan Tinggi';
        $institutionName =$application?->institution_name ?? '-';
        $major =$application?->major ?? '-';
        $issuedDateText = \Carbon\Carbon::parse($issued_date)->locale('id')->translatedFormat('d F Y');
        $startDateText =$application?->start_date
            ? \Carbon\Carbon::parse($application->start_date)->locale('id')->translatedFormat('d F Y')
            : '-';
        $endDateText =$application?->end_date
            ? \Carbon\Carbon::parse($application->end_date)->locale('id')->translatedFormat('d F Y')
            : '-';

        $technicalTotal = collect($technical_scores)->sum(fn ($item) => (float) ($item['score'] ?? 0));
        $skillTotal = collect($skill_scores)->sum(fn ($item) => (float) ($item['score'] ?? 0));

        $cornerTopRightSvg = 'data:image/svg+xml;base64,'.base64_encode('
            <svg xmlns="http://www.w3.org/2000/svg" width="220" height="160" viewBox="0 0 220 160">
                <polygon points="75,0 220,0 220,115" fill="#d4af37"/>
                <polygon points="88,0 220,0 220,104" fill="#1e3a8a"/>
                <polygon points="118,0 220,0 220,80" fill="#172554"/>
                <polygon points="126,0 135,0 220,66 220,73" fill="#e5c158"/>
                <polygon points="154,0 220,0 220,50" fill="#0f172a"/>
            </svg>
        ');

        $cornerBottomLeftSvg = 'data:image/svg+xml;base64,'.base64_encode('
            <svg xmlns="http://www.w3.org/2000/svg" width="220" height="160" viewBox="0 0 220 160">
                <polygon points="0,45 145,160 0,160" fill="#d4af37"/>
                <polygon points="0,56 132,160 0,160" fill="#1e3a8a"/>
                <polygon points="0,80 102,160 0,160" fill="#172554"/>
                <polygon points="0,87 0,94 85,160 94,160" fill="#e5c158"/>
                <polygon points="0,110 66,160 0,160" fill="#0f172a"/>
            </svg>
        ');

        $filigreeCornerSvg = 'data:image/svg+xml;base64,'.base64_encode('
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                <path d="M2,58 L2,14 Q2,2 14,2 L58,2" fill="none" stroke="#c9a45c" stroke-width="2.2"/>
                <path d="M7,50 L7,17 Q7,7 17,7 L50,7" fill="none" stroke="#1e3a8a" stroke-width="1"/>
                <circle cx="11" cy="11" r="3" fill="#c9a45c"/>
                <path d="M16,11 L26,11 M11,16 L11,26" stroke="#c9a45c" stroke-width="1.5"/>
            </svg>
        ');

        $dividerOrnamentSvg = 'data:image/svg+xml;base64,'.base64_encode('
            <svg xmlns="http://www.w3.org/2000/svg" width="340" height="16" viewBox="0 0 340 16">
                <line x1="10" y1="8" x2="145" y2="8" stroke="#c9a45c" stroke-width="1.3"/>
                <line x1="195" y1="8" x2="330" y2="8" stroke="#c9a45c" stroke-width="1.3"/>
                <polygon points="170,2 178,8 170,14 162,8" fill="#1e3a8a" stroke="#c9a45c" stroke-width="1.2"/>
                <circle cx="152" cy="8" r="2.2" fill="#c9a45c"/>
                <circle cx="188" cy="8" r="2.2" fill="#c9a45c"/>
            </svg>
        ');

        $bgWaveSvg = 'data:image/svg+xml;base64,'.base64_encode('
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
                <path d="M0,420 C220,340 520,480 800,320 L800,500 L0,500 Z" fill="#eff6ff" opacity="0.65"/>
                <path d="M0,0 L800,0 L800,110 C560,190 280,60 0,150 Z" fill="#f8fafc" opacity="0.85"/>
                <circle cx="400" cy="250" r="165" fill="none" stroke="#dbeafe" stroke-width="1.5" stroke-dasharray="6,6"/>
                <circle cx="400" cy="250" r="145" fill="none" stroke="#fef3c7" stroke-width="1.2"/>
            </svg>
        ');
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
            padding: 8mm 11mm;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .certificate-page {
            border: 1.2mm solid #1e3a8a;
            page-break-after: always;
        }
        .certificate-page:before {
            position: absolute;
            z-index: 1;
            top: 2.2mm;
            right: 2.2mm;
            bottom: 2.2mm;
            left: 2.2mm;
            border: .45mm solid #c9a45c;
            content: "";
        }
        .canva-bg, .bg-wave {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }
        .ribbon-tr {
            position: absolute;
            top: 0;
            right: 0;
            width: 44mm;
            height: 32mm;
            z-index: 0;
        }
        .ribbon-bl {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 46mm;
            height: 33mm;
            z-index: 0;
        }
        .filigree {
            position: absolute;
            width: 13mm;
            height: 13mm;
            z-index: 1;
        }
        .filigree-tl { top: 3mm; left: 3mm; }
        .filigree-br { right: 3mm; bottom: 3mm; transform: rotate(180deg); }
        .watermark {
            position: absolute;
            top: 48mm;
            left: 106mm;
            width: 68mm;
            height: 68mm;
            opacity: .065;
            z-index: 0;
        }
        .page-content { position: relative; z-index: 2; }
        table { border-collapse: collapse; }
        .letterhead { width: 100%; height: 19mm; }
        .letterhead td { vertical-align: middle; }
        .letterhead-logo { width: 22mm; text-align: center; }
        .letterhead-logo img { width: 16.5mm; height: 16.5mm; }
        .letterhead-diskominfo { width: 28mm; text-align: center; padding-right: 4mm; }
        .letterhead-diskominfo img { max-width: 21mm; max-height: 14.5mm; }
        .government { margin: 0; font-size: 9.5pt; font-weight: bold; letter-spacing: .45pt; color: #1e293b; }
        .department { margin: .8mm 0; color: #1e3a8a; font-size: 11.5pt; font-weight: bold; letter-spacing: .5pt; }
        .address, .contact { margin: .4mm 0 0; color: #475569; font-size: 6.3pt; }
        .gold-divider { height: .65mm; margin: 1mm 0 2mm; background: #c9a45c; }
        .certificate-title {
            margin: .5mm 0 0;
            color: #1e3a8a;
            font-size: 22pt;
            font-weight: bold;
            letter-spacing: 3pt;
            text-align: center;
        }
        .title-ornament {
            display: block;
            width: 82mm;
            height: 4mm;
            margin: .5mm auto 0;
        }
        .certificate-number {
            margin: .5mm 0 1.5mm;
            color: #334155;
            font-size: 8.5pt;
            font-weight: bold;
            text-align: center;
        }
        .recipient-layout { width: 94%; margin: 1.5mm auto 0; }
        .photo-cell { width: 42mm; padding: 1.5mm 6mm 1.5mm 1mm; text-align: center; vertical-align: middle; }
        .photo-frame {
            width: 29mm;
            height: 38mm;
            margin: 0 auto;
            padding: .5mm;
            border: .65mm solid #1e3a8a;
            outline: .3mm solid #c9a45c;
            background: #f8fafc;
        }
        .recipient-photo { width: 27.5mm; height: 36.5mm; object-fit: cover; }
        .photo-initials { color: #1e3a8a; font-size: 21pt; font-weight: bold; line-height: 36.5mm; }
        .photo-caption { margin-top: 1.5mm; color: #475569; font-size: 5.8pt; font-weight: bold; }
        .recipient-info { vertical-align: middle; }
        .recipient-label { margin: 0 0 1mm; color: #475569; font-size: 8.8pt; font-style: italic; }
        .biodata { width: 100%; font-size: 8.8pt; }
        .biodata td { padding: 1.2mm 1mm; vertical-align: top; }
        .biodata .label { width: 31mm; color: #475569; }
        .biodata .colon { width: 5mm; text-align: center; }
        .intern-name {
            color: #0f172a;
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: .35mm solid #c9a45c;
            padding-bottom: .6mm;
        }
        .description { width: 84%; margin: 2.5mm auto 2mm; color: #334155; font-size: 8.3pt; line-height: 1.42; text-align: center; }
        .result-badge {
            width: 78mm;
            margin: 0 auto;
            padding: 1.8mm 4mm;
            border: .5mm solid #c9a45c;
            border-radius: 2mm;
            background: #fffbeb;
            color: #1e3a8a;
            font-size: 11.5pt;
            font-weight: bold;
            letter-spacing: 1.2pt;
            text-align: center;
        }
        .signature-kadis { position: absolute; right: 14mm; bottom: 8.5mm; width: 76mm; text-align: center; z-index: 2; }
        .signature-kadis .caption { font-size: 7.5pt; line-height: 1.35; }
        .signature-space { height: 15mm; }
        .signature-name { font-size: 8pt; font-weight: bold; text-decoration: underline; }
        .signature-title { margin-top: .8mm; font-size: 7pt; }
        .qr-block {
            position: absolute;
            bottom: 8.5mm;
            left: 16mm;
            width: 52mm;
            padding: 1.5mm;
            border: .3mm solid #cbd5e1;
            border-radius: 1.5mm;
            background: rgba(255, 255, 255, 0.92);
            text-align: center;
            z-index: 2;
        }
        .qr-block img { width: 15.5mm; height: 15.5mm; }
        .qr-label { margin: .8mm 0 0; color: #334155; font-size: 5.3pt; font-weight: bold; }

        /* Halaman 2 - Daftar Nilai */
        .transcript-page {
            padding: 7mm 10mm;
            border: .9mm solid #1e3a8a;
        }
        .transcript-page:before {
            position: absolute;
            z-index: 0;
            top: 1.8mm;
            right: 1.8mm;
            bottom: 1.8mm;
            left: 1.8mm;
            border: .3mm solid #c9a45c;
            content: "";
        }
        .transcript-header { padding-bottom: 1.8mm; border-bottom: .6mm solid #c9a45c; }
        .transcript-title { margin: 0 0 .8mm; color: #1e3a8a; font-size: 16pt; font-weight: bold; letter-spacing: 1.5pt; text-align: center; }
        .transcript-number { margin: 0; color: #475569; font-size: 7pt; text-align: center; font-weight: bold; }
        .transcript-biodata { width: 100%; margin: 1.8mm 0; font-size: 7pt; background: #f8fafc; border: .25mm solid #e2e8f0; }
        .transcript-biodata td { padding: 1mm 2mm; }
        .transcript-biodata .label { color: #64748b; width: 24mm; }
        .section-title { margin: 1.6mm 0 .7mm; color: #1e3a8a; font-size: 7.4pt; font-weight: bold; }
        .score-table { width: 100%; font-size: 6.9pt; }
        .score-table th, .score-table td { padding: .95mm 1.5mm; border: .25mm solid #cbd5e1; }
        .score-table th { background: #1e3a8a; color: #ffffff; font-size: 6.4pt; text-align: left; }
        .score-table .number { width: 12mm; text-align: center; }
        .score-table .score { width: 25mm; text-align: center; }
        .score-table .total-row { background: #eff6ff; font-weight: bold; color: #1e3a8a; }
        .summary { margin: 1.8mm 0; padding: 1.8mm 3mm; border: .35mm solid #c9a45c; background: #fffbeb; color: #1e3a8a; font-size: 7.8pt; font-weight: bold; }
        .bottom-layout { width: 100%; margin-top: 1.5mm; }
        .bottom-layout td { width: 50%; vertical-align: top; }
        .scale-table { width: 92%; font-size: 6pt; }
        .scale-table th, .scale-table td { padding: .9mm 1.5mm; border: .25mm solid #cbd5e1; }
        .scale-table th { background: #f1f5f9; color: #1e3a8a; text-align: left; }
        .mentor-signature { padding-left: 12mm; text-align: center; font-size: 7pt; }
        .mentor-signature .role { min-height: 7.5mm; }
        .mentor-signature .space { height: 11mm; }
        .mentor-signature .name { font-weight: bold; text-decoration: underline; text-transform: uppercase; }
        .page-count { position: absolute; right: 10mm; bottom: 4mm; color: #64748b; font-size: 5.5pt; z-index: 2; }
    </style>
</head>
<body>
    <section class="page certificate-page">
        @if ($canvaBg)
            <img class="canva-bg" src="{{ $canvaBg }}" alt="">
        @else
            <img class="bg-wave" src="{{ $bgWaveSvg }}" alt="">
            <img class="ribbon-tr" src="{{ $cornerTopRightSvg }}" alt="">
            <img class="ribbon-bl" src="{{ $cornerBottomLeftSvg }}" alt="">
            <img class="filigree filigree-tl" src="{{ $filigreeCornerSvg }}" alt="">
            <img class="filigree filigree-br" src="{{ $filigreeCornerSvg }}" alt="">
        @endif

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
            <img class="title-ornament" src="{{ $dividerOrnamentSvg }}" alt="">
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
                        <p class="photo-caption">PAS FOTO PESERTA</p>
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
                selama {{ $duration_months }} bulan terhitung dari tanggal {{ $startDateText }} s/d {{$endDateText }}
                dengan hasil:
            </p>
            <div class="result-badge">{{ $grade_description }}</div>
        </div>

        <div class="qr-block">
            @if (! empty($qr_code_data_uri))
                <img src="{{ $qr_code_data_uri }}" alt="QR verifikasi sertifikat">
            @endif
            <p class="qr-label">Pindai untuk verifikasi sertifikat</p>
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
        <div class="page-content">
            <div class="transcript-header">
                <h1 class="transcript-title">DAFTAR NILAI</h1>
                <p class="transcript-number">Nomor Sertifikat: {{ $certificate->certificate_number ?? '-' }}</p>
            </div>
            <table class="transcript-biodata">
                <tr>
                    <td class="label">Nama</td><td><strong>{{ $intern->name ?? '-' }}</strong></td>
                    <td class="label">{{ $studentNumberLabel }}</td><td>{{$application?->student_number ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="label">Jurusan</td><td>{{ $major }}</td>
                    <td class="label">{{ $institutionLabel }}</td><td>{{$institutionName }}</td>
                </tr>
            </table>

            <p class="section-title">A. KETERAMPILAN (PENILAIAN TETAP DISKOMINFO)</p>
            <table class="score-table">
                <thead><tr><th class="number">NO.</th><th>KRITERIA PENILAIAN</th><th class="score">NILAI</th></tr></thead>
                <tbody>
                    @foreach ($skill_scores as $index =>$item)
                        <tr><td class="number">{{ $index + 1 }}</td><td>{{$item['criteria'] }}</td><td class="score">{{ is_numeric($item['score']) ? number_format((float) $item['score'], 2) : '—' }}</td></tr>
                    @endforeach
                    <tr class="total-row"><td colspan="2">Jumlah Nilai Keterampilan</td><td class="score">{{ number_format($skillTotal, 2) }}</td></tr>
                </tbody>
            </table>

            @if ($technical_scores !== [])
                <p class="section-title">B. NILAI TEKNIS</p>
                <table class="score-table">
                    <thead><tr><th class="number">NO.</th><th>KRITERIA PENILAIAN</th><th class="score">NILAI</th></tr></thead>
                    <tbody>
                        @foreach ($technical_scores as $index =>$item)
                            <tr><td class="number">{{ $index + 1 }}</td><td>{{$item['criteria'] ?? 'Aspek Teknis' }}</td><td class="score">{{ number_format((float) ($item['score'] ?? 0), 2) }}</td></tr>
                        @endforeach
                        <tr class="total-row"><td colspan="2">Jumlah Nilai Teknis</td><td class="score">{{ number_format($technicalTotal, 2) }}</td></tr>
                    </tbody>
                </table>
            @endif

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
                        <div class="role">Tanjung, {{ $issuedDateText }}<br>{{$mentor_position ?: 'Pembimbing Lapangan,' }}</div>
                        <div class="space"></div>
                        <div class="name">{{ $evaluation?->mentor?->name ?? 'PEMBIMBING LAPANGAN' }}</div>
                        <div>NIP {{ $mentor_nip ?: '-' }}</div>
                    </td>
                </tr>
            </table>
        </div>
        <p class="page-count">Halaman 2 dari 2</p>
    </section>
</body>
</html>