<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Sertifikat Magang - {{ $intern->name ?? 'Peserta' }}</title>
    @php
        $tabalongPath = public_path('images/logo-tabalong.png');
        $komdigiPath = public_path('images/logo-komdigi.png');
        $logoTabalong = is_file($tabalongPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($tabalongPath))
            : null;
        $logoKomdigi = is_file($komdigiPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($komdigiPath))
            : null;
        $photoPath = $intern?->profile_photo_path
            ? storage_path('app/public/'.$intern->profile_photo_path)
            : null;
        $photoData = $photoPath && is_file($photoPath)
            ? 'data:'.(mime_content_type($photoPath) ?: 'image/jpeg').';base64,'.base64_encode(file_get_contents($photoPath))
            : null;
        $isSmk = $education_level === 'SMK';
        $studentNumberLabel = $isSmk ? 'NISN' : 'NIM';
        $institutionName = $application?->institution_name ?? '-';
        $major = $application?->major ?? '-';
        $divisionName = $application?->division?->name ?? $intern?->division?->name ?? '-';
        $divisionName = preg_replace('/^Bidang\s+/i', '', $divisionName);
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
        @page { size: A4 landscape; margin: 6mm; }
        * { box-sizing: border-box; color: #000000 !important; }
        html, body { margin: 0; padding: 0; background: #ffffff; color: #000000; font-family: 'DejaVu Sans', Arial, sans-serif; }
        table { border-collapse: collapse; }
        p { padding: 0; }

        .page-frame { height: 192mm; border: 4px solid #0f2c59; padding: 2px; }
        .page-inner { height: 100%; border: 1.5px solid #b59449; padding: 12px 28px; }
        .transcript-inner { padding: 10px 24px; }
        .page-layout { width: 100%; height: 100%; table-layout: fixed; }
        .page-layout > tbody > tr > td { padding: 0; }
        .page-main { vertical-align: top; }
        .page-footer { vertical-align: bottom; }
        .letterhead { width: 100%; table-layout: fixed; }
        .letterhead td { vertical-align: middle; }
        .letterhead-left, .letterhead-right { width: 12%; }
        .letterhead-left { text-align: left; }
        .letterhead-right { text-align: right; }
        .letterhead-left img, .letterhead-right img { height: 68px; width: auto; }
        .letterhead-center { width: 76%; text-align: center; }
        .government { margin: 0; font-size: 13.5pt; font-weight: bold; }
        .department { margin: 2px 0; font-size: 18pt; font-weight: bold; }
        .address { margin: 0; font-size: 8.5pt; }
        .contact { margin: 2px 0 0; font-size: 8pt; }
        .gold-divider { height: 0; margin: 5px 0 8px; border-bottom: 1.5px solid #b59449; }
        .certificate-title { margin: 0; font-family: 'DejaVu Serif', serif; font-size: 26pt; font-weight: bold; letter-spacing: 2px; text-align: center; }
        .certificate-number { margin: 2px 0 10px; font-size: 10pt; font-weight: bold; text-align: center; }
        .recipient-layout { width: 68%; margin: 0 auto; }
        .recipient-photo-cell { width: 115px; vertical-align: top; }
        .recipient-info { padding-left: 10px; vertical-align: top; }
        .photo-frame { width: 96px; height: 126px; border: 1.5px solid #000000; text-align: center; vertical-align: middle; overflow: hidden; }
        .photo-frame img { max-width: 94px; max-height: 124px; width: auto; height: auto; }
        .photo-fallback { font-size: 7.5pt; line-height: 124px; }
        .recipient-label { margin: 0 0 4px; font-size: 9.5pt; font-style: italic; }
        .biodata { width: 100%; font-size: 10pt; line-height: 1.35; }
        .biodata td { padding: 1px 0; vertical-align: top; }
        .biodata .label { width: 100px; }
        .biodata .colon { width: 12px; text-align: center; }
        .intern-name { font-weight: bold; text-transform: uppercase; }
        .description { width: 82%; margin: 10px auto 8px; font-size: 11pt; line-height: 1.35; text-align: center; }
        .result-badge { width: 270px; margin: 0 auto; padding: 6px 14px; border: 1.5px solid #b59449; font-size: 13.5pt; font-weight: bold; text-align: center; }
        .certificate-footer { width: 100%; margin-top: 10px; table-layout: fixed; }
        .certificate-footer td { vertical-align: bottom; }
        .qr-cell { width: 40%; }
        .qr-box { width: 105px; height: 105px; padding: 3px; border: 1px solid #000000; text-align: center; vertical-align: middle; }
        .qr-box img { width: 98px; height: 98px; }
        .qr-caption { margin-top: 3px; font-size: 7.5pt; }
        .signature-kadis { width: 60%; font-size: 9.5pt; line-height: 1.3; text-align: right; }
        .signature-space { height: 48px; }
        .signature-name { font-weight: bold; text-decoration: underline; }
        .transcript-page { background: #ffffff; }
        .transcript-title { margin: 0; font-size: 16pt; font-weight: bold; text-align: center; }
        .transcript-divider { height: 0; margin: 4px 0 8px; border-bottom: 1.5px solid #000000; }
        .section-title { margin: 0 0 3px; font-size: 9pt; font-weight: bold; }
        .technical-section { margin-top: 8px; }
        .score-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 8.5pt; background: #ffffff; }
        .score-table th, .score-table td { padding: 3.5px 6px; border: 1px solid #000000; color: #000000 !important; background: #ffffff; }
        .score-table .number { width: 38px; text-align: center; }
        .score-table .criteria { text-align: left; }
        .score-table .score { width: 75px; text-align: center; }
        .score-table .total-row td { font-weight: bold; }
        .summary { margin: 6px 0; font-size: 9.5pt; font-weight: bold; }
        .summary-grade { padding-left: 18px; }
        .bottom-layout { width: 100%; margin-top: 6px; table-layout: fixed; }
        .bottom-layout td { vertical-align: top; }
        .scale-cell { width: 44%; }
        .scale-title { margin: 0 0 3px; font-size: 8pt; font-weight: bold; }
        .scale-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: center; background: #ffffff; }
        .scale-table th, .scale-table td { padding: 2.5px 4px; border: 1px solid #000000; color: #000000 !important; background: #ffffff; }
        .mentor-signature { width: 56%; padding-top: 10px; font-size: 9.5pt; line-height: 1.35; text-align: right; }
        .mentor-signature-space { height: 46px; }
    </style>
</head>
<body>
    <div class="page-frame">
        <div class="page-inner">
            <table class="page-layout">
                <tr><td class="page-main">
            <table class="letterhead">
                <tr>
                    <td class="letterhead-left">@if ($logoTabalong)<img src="{{ $logoTabalong }}" alt="Logo Kabupaten Tabalong">@endif</td>
                    <td class="letterhead-center">
                        <p class="government">PEMERINTAH KABUPATEN TABALONG</p>
                        <p class="department">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                        <p class="address">Jl. Cempaka No. 38 Tanjung, Tabalong, Kalimantan Selatan 71513</p>
                        <p class="contact">Telepon (0526) 2023169 · diskominfo.tabalongkab.go.id · diskominfo@tabalongkab.go.id</p>
                    </td>
                    <td class="letterhead-right">@if ($logoKomdigi)<img src="{{ $logoKomdigi }}" alt="Logo KOMDIGI">@endif</td>
                </tr>
            </table>
            <div class="gold-divider"></div>
            <h1 class="certificate-title">SERTIFIKAT</h1>
            <p class="certificate-number">Nomor : {{ $certificate->certificate_number ?? '-' }}</p>

            <table class="recipient-layout">
                <tr>
                    <td class="recipient-photo-cell">
                        <div class="photo-frame">
                            @if ($photoData)
                                <img src="{{ $photoData }}" alt="Pas foto peserta">
                            @else
                                <div class="photo-fallback">PAS FOTO 3x4</div>
                            @endif
                        </div>
                    </td>
                    <td class="recipient-info">
                        <p class="recipient-label">Diberikan kepada:</p>
                        <table class="biodata">
                            <tr><td class="label">Nama</td><td class="colon">:</td><td class="value intern-name">{{ $intern->name ?? 'Peserta Magang' }}</td></tr>
                            <tr><td class="label">{{ $studentNumberLabel }}</td><td class="colon">:</td><td class="value">{{ $application?->student_number ?? '-' }}</td></tr>
                            <tr><td class="label">Jurusan</td><td class="colon">:</td><td class="value">{{ $major }}</td></tr>
                            <tr><td class="label">Asal Institusi</td><td class="colon">:</td><td class="value">{{ $institutionName }}</td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p class="description">Telah mengikuti program magang selama {{ $duration_months }} bulan terhitung dari tanggal {{ $startDateText }} s/d {{ $endDateText }} dengan hasil:</p>
            <div class="result-badge">{{ $grade_description }}</div>
                </td></tr>
                <tr><td class="page-footer">
        <table class="certificate-footer">
            <tr>
                <td class="qr-cell">
                    <table class="qr-box"><tr><td>
                        @if (! empty($qr_code_data_uri))
                            <img src="{{ $qr_code_data_uri }}" alt="QR code verifikasi sertifikat">
                        @else
                            <span>QR CODE</span>
                        @endif
                    </td></tr></table>
                    <div class="qr-caption">Pindai untuk verifikasi sertifikat</div>
                </td>
                <td class="signature-kadis">
                    <div>Tanjung, {{ $issuedDateText }}</div>
                    <div>Kepala Dinas Komunikasi dan Informatika,</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">Eddy Suryani, S.Sos, MA</div>
                    <div>Pembina Tk. I/(IV/b)</div>
                    <div>NIP 197412231994031004</div>
                </td>
            </tr>
        </table>
                </td></tr>
            </table>
            </div>
        </div>
    </div>

    <div style="page-break-before: always;"></div>

    <div class="page-frame">
        <div class="page-inner transcript-inner">
            <table class="page-layout transcript-page">
                <tr><td class="page-main">
        <h1 class="transcript-title">DAFTAR NILAI</h1>
        <div class="transcript-divider"></div>

        <p class="section-title">NILAI KETERAMPILAN</p>
        <table class="score-table">
            <thead><tr><th class="number">NO.</th><th class="criteria">KRITERIA PENILAIAN</th><th class="score">NILAI</th></tr></thead>
            <tbody>
                @foreach ($skill_scores as $index => $item)
                    <tr><td class="number">{{ $index + 1 }}</td><td class="criteria">{{ $item['criteria'] }}</td><td class="score">{{ is_numeric($item['score']) ? number_format((float) $item['score'], 2) : '—' }}</td></tr>
                @endforeach
                <tr class="total-row"><td class="number"></td><td>Jumlah Nilai Keterampilan</td><td class="score">{{ number_format($skillTotal, 2) }}</td></tr>
            </tbody>
        </table>

        <div class="technical-section">
            <p class="section-title">NILAI TEKNIS</p>
            <table class="score-table">
                <thead><tr><th class="number">NO.</th><th class="criteria">KRITERIA PENILAIAN</th><th class="score">NILAI</th></tr></thead>
                <tbody>
                    @forelse ($technical_scores as $index => $item)
                        <tr><td class="number">{{ $index + 1 }}</td><td class="criteria">{{ $item['criteria'] ?? 'Aspek Teknis' }}</td><td class="score">{{ is_numeric($item['score'] ?? null) ? number_format((float) $item['score'], 2) : '—' }}</td></tr>
                    @empty
                        <tr><td class="number">-</td><td class="criteria">Belum ada nilai teknis</td><td class="score">—</td></tr>
                    @endforelse
                    <tr class="total-row"><td class="number"></td><td>Jumlah Nilai Teknis</td><td class="score">{{ number_format($technicalTotal, 2) }}</td></tr>
                </tbody>
            </table>
        </div>

        <div class="summary">
            Nilai Akhir: {{ number_format((float) ($evaluation?->final_score ?? 0), 2) }} ({{ $grade_letter }})
            <span class="summary-grade">Sebutan: {{ mb_strtoupper($grade_description) }}</span>
        </div>

                </td></tr>
                <tr><td class="page-footer">
        <table class="bottom-layout">
            <tr>
                <td class="scale-cell">
                    <p class="scale-title">KETERANGAN NILAI</p>
                    <table class="scale-table">
                        <thead><tr><th>RENTANG</th><th>MUTU</th><th>SEBUTAN</th></tr></thead>
                        <tbody>
                            <tr><td>90 - 100</td><td>A</td><td>SANGAT BAIK</td></tr>
                            <tr><td>80 - 89</td><td>B</td><td>BAIK</td></tr>
                            <tr><td>60 - 79</td><td>C</td><td>CUKUP</td></tr>
                            <tr><td>00 - 59</td><td>D</td><td>KURANG</td></tr>
                        </tbody>
                    </table>
                </td>
                <td class="mentor-signature">
                    <div>Tanjung, {{ $issuedDateText }}</div>
                    <div>Kabid {{ $divisionName }}</div>
                    <div class="mentor-signature-space"></div>
                    <div class="signature-name">{{ $kabid_name ?: 'Nama Kabid belum tersedia' }}</div>
                    @if (! empty($kabid_position))
                        <div>{{ $kabid_position }}</div>
                    @endif
                    @if (! empty($kabid_nip))
                        <div>NIP {{ $kabid_nip }}</div>
                    @endif
                </td>
            </tr>
        </table>
                </td></tr>
            </table>
        </div>
    </div>
</body>
</html>
