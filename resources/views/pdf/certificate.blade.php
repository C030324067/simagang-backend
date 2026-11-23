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
        @page { size: A4 landscape; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; color: #111827; background: #fff; font-family: DejaVu Sans, Helvetica, Arial, sans-serif; }
        .page { position: relative; width: 297mm; height: 210mm; margin: 0; overflow: hidden; page-break-inside: avoid; background: #fff; }

        /* Halaman 1: sertifikat */
        .certificate-frame { position: absolute; z-index: 0; top: 7px; right: 7px; bottom: 7px; left: 7px; border: 5px solid #163868; }
        .certificate-frame:before { position: absolute; content: ""; top: 5px; right: 5px; bottom: 5px; left: 5px; border: 1.5px solid #b69648; }
        .certificate-frame:after { position: absolute; content: ""; left: 0; right: 0; bottom: 1px; height: 3px; background: #163868; }
        .bottom-accent { position: absolute; z-index: 0; left: 14px; right: 14px; bottom: 15px; height: 2px; background: #3b82f6; }
        .certificate-content { position: relative; z-index: 1; height: 100%; padding: 22px 45px 18px; }
        table { border-collapse: collapse; }
        .letterhead { width: 100%; table-layout: fixed; }
        .letterhead td { vertical-align: middle; }
        .letterhead-left, .letterhead-right { width: 13%; }
        .letterhead-left { text-align: left; }
        .letterhead-right { text-align: right; }
        .letterhead-left img { width: 82px; height: 88px; object-fit: contain; }
        .letterhead-right img { width: 82px; height: 82px; object-fit: contain; }
        .letterhead-center { width: 74%; text-align: center; }
        .government { margin: 0; color: #111827; font-size: 15pt; font-weight: bold; }
        .department { margin: 2px 0; color: #163868; font-size: 20pt; font-weight: bold; }
        .address { margin: 0; color: #374151; font-size: 9.5pt; }
        .contact { margin: 2px 0 0; color: #374151; font-size: 9pt; }
        .gold-divider { height: 1.5px; margin: 8px 0; background: #b69648; }
        .certificate-title { margin: 0; color: #163868; font-size: 28pt; font-weight: bold; letter-spacing: 1px; text-align: center; }
        .certificate-number { margin: 2px 0 0; color: #1e293b; font-size: 11pt; font-weight: bold; text-align: center; }
        .recipient-layout { width: 68%; margin: 16px auto; }
        .recipient-photo-cell { width: 135px; vertical-align: middle; }
        .recipient-info { padding-left: 10px; vertical-align: middle; }
        .photo-frame { width: 96px; height: 128px; border: 1.5px solid #163868; text-align: center; }
        .photo-frame img { display: block; width: 94px; height: 126px; object-fit: cover; }
        .photo-fallback { color: #163868; font-size: 10pt; font-weight: bold; line-height: 126px; }
        .recipient-label { margin: 0 0 6px; color: #4b5563; font-size: 10.5pt; font-style: italic; }
        .biodata { width: 100%; font-size: 11pt; }
        .biodata td { padding: 2px 0; vertical-align: top; }
        .biodata .label { width: 115px; color: #4b5563; }
        .biodata .colon { width: 12px; text-align: center; }
        .biodata .value { color: #111827; }
        .intern-name { font-weight: bold; text-transform: uppercase; }
        .description { max-width: 82%; margin: 0 auto; color: #111827; font-size: 13.5pt; line-height: 1.45; text-align: center; }
        .result-badge { width: 310px; margin: 12px auto 0; padding: 9px 20px; border: 1.5px solid #b69648; border-radius: 6px; color: #163868; font-size: 14pt; font-weight: bold; text-align: center; }
        .certificate-footer { position: absolute; right: 45px; bottom: 40px; left: 45px; width: auto; }
        .certificate-footer td { vertical-align: bottom; }
        .qr-cell { width: 50%; }
        .qr-box { width: 130px; height: 110px; border: 1px solid #d1d5db; border-radius: 8px; text-align: center; vertical-align: middle; }
        .qr-box img { width: 70px; height: 70px; }
        .qr-fallback-title { color: #163868; font-size: 10pt; font-weight: bold; }
        .qr-fallback-copy { margin-top: 5px; color: #6b7280; font-size: 7.5pt; }
        .qr-caption { margin-top: 3px; color: #6b7280; font-size: 7.5pt; }
        .signature-kadis { width: 50%; text-align: right; color: #111827; font-size: 10.5pt; line-height: 1.35; }
        .signature-space { height: 52px; }
        .signature-name { font-weight: bold; }
        .page-count { position: absolute; right: 24px; bottom: 20px; z-index: 2; margin: 0; color: #6b7280; font-size: 7.5pt; }

        /* Halaman 2: transkrip */
        .transcript-page { page-break-before: always; padding: 28px 45px 20px; }
        .transcript-title { margin: 0; color: #163868; font-size: 20pt; font-weight: bold; text-align: center; }
        .transcript-divider { height: 1.5px; margin: 6px 0 14px; background: #b69648; }
        .section-title { margin: 0 0 5px; color: #111827; font-size: 10pt; font-weight: bold; }
        .technical-section { margin-top: 14px; }
        .score-table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; font-size: 9.5pt; }
        .score-table th, .score-table td { padding: 5px 10px; border: 1px solid #e5e7eb; }
        .score-table th { color: #111827; font-weight: bold; text-transform: uppercase; }
        .score-table .number { width: 60px; text-align: center; }
        .score-table .criteria { text-align: left; }
        .score-table .score { width: 110px; text-align: center; }
        .score-table .total-row td { font-weight: bold; }
        .summary { margin-top: 10px; color: #111827; font-size: 10.5pt; font-weight: bold; }
        .summary-grade { padding-left: 34px; }
        .bottom-layout { width: 100%; margin-top: 12px; }
        .bottom-layout td { vertical-align: top; }
        .scale-cell { width: 55%; }
        .scale-title { margin: 0 0 4px; color: #111827; font-size: 9pt; font-weight: bold; }
        .scale-table { width: 80%; border-collapse: collapse; border: 1px solid #e5e7eb; font-size: 8.5pt; text-align: center; }
        .scale-table th, .scale-table td { padding: 4px 8px; border: 1px solid #e5e7eb; }
        .scale-table th { font-weight: bold; }
        .mentor-signature { width: 45%; padding-top: 18px; color: #111827; font-size: 10.5pt; line-height: 1.4; text-align: right; }
        .mentor-signature-space { height: 55px; }
        .transcript-page-count { position: absolute; right: 45px; bottom: 20px; margin: 0; color: #6b7280; font-size: 7.5pt; }
    </style>
</head>
<body>
    <section class="page certificate-page">
        <div class="certificate-frame"></div>
        <div class="bottom-accent"></div>
        <div class="certificate-content">
            <table class="letterhead">
                <tr>
                    <td class="letterhead-left">@if ($logoTabalong)<img src="{{ $logoTabalong }}" alt="Logo Kabupaten Tabalong">@endif</td>
                    <td class="letterhead-center">
                        <p class="government">PEMERINTAH KABUPATEN TABALONG</p>
                        <p class="department">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                        <p class="address">Jl. Cempaka No. 38 Tanjung, Tabalong, Kalimantan Selatan 71513</p>
                        <p class="contact">Telepon (0526) 2023169 · diskominfo.tabalongkab.go.id · diskominfo@tabalongkab.go.id</p>
                    </td>
                    <td class="letterhead-right">@if ($logoDiskominfo)<img src="{{ $logoDiskominfo }}" alt="Logo Diskominfo">@endif</td>
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
                                <div class="photo-fallback">PAS FOTO</div>
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
        </div>

        <table class="certificate-footer">
            <tr>
                <td class="qr-cell">
                    <table class="qr-box"><tr><td>
                        @if (! empty($qr_code_data_uri))
                            <img src="{{ $qr_code_data_uri }}" alt="QR code verifikasi sertifikat">
                            <div class="qr-caption">Pindai untuk verifikasi sertifikat</div>
                        @else
                            <div class="qr-fallback-title">QR CODE</div>
                            <div class="qr-fallback-copy">Pindai untuk verifikasi sertifikat</div>
                        @endif
                    </td></tr></table>
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
        <p class="page-count">Halaman 1 dari 2</p>
    </section>

    <section class="page transcript-page">
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
                </td>
            </tr>
        </table>
        <p class="transcript-page-count">Halaman 2 dari 2</p>
    </section>
</body>
</html>
