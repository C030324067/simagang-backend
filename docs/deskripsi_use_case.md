# Deskripsi Use Case SIMAGANG

Dokumen ini melengkapi [diagram use case](./use_case_diagram.puml) dan merinci enam skenario utama. Alur mengikuti fitur dan aturan validasi yang tersedia pada backend SIMAGANG.

## UC-01 — Mengajukan Permohonan Magang

- **Aktor utama:** Peserta Magang / Pemohon.
- **Deskripsi:** Peserta mengirim data permohonan magang beserta dokumen pendukung agar diproses oleh Kepegawaian, Kabid, dan Kadis.
- **Prasyarat:** Peserta memiliki data pemohon dan dokumen yang akan diunggah. Untuk alur pengajuan setelah akun dibuat, peserta sudah login. Pendaftaran awal juga tersedia melalui formulir publik.
- **Kondisi akhir:** Permohonan tersimpan dengan kode tracking dan status awal untuk diproses. Berkas tersimpan dan dapat diperiksa oleh petugas berwenang.
- **Alur utama:**
  1. Peserta membuka formulir permohonan dan memilih jenis permohonan.
  2. Peserta mengisi institusi, jurusan, nomor mahasiswa (jika diminta), serta tanggal mulai dan selesai.
  3. Peserta mengunggah berkas pengajuan yang diminta, seperti proposal, CV, transkrip, kartu mahasiswa, dan surat rekomendasi sesuai jenis permohonan.
  4. Sistem memvalidasi isian, format, ukuran berkas, serta periode pendaftaran/kuota yang berlaku.
  5. Sistem menyimpan permohonan, mengaitkannya dengan akun pemohon, dan membuat kode tracking.
  6. Sistem menampilkan konfirmasi pengajuan dan kode tracking kepada peserta.
- **Alur alternatif:**
  - **A1 — Data atau berkas tidak valid:** Sistem menolak pengiriman, menampilkan kesalahan pada data/berkas terkait, dan meminta peserta memperbaikinya.
  - **A2 — Periode pendaftaran tutup atau kuota penuh:** Sistem tidak menyimpan permohonan dan memberi tahu peserta bahwa pendaftaran tidak tersedia.
  - **A3 — Email sudah terdaftar pada pendaftaran publik:** Sistem menolak pembuatan akun/pengajuan duplikat dan meminta pemohon menggunakan alur login atau pelacakan yang tersedia.

## UC-02 — Melakukan Presensi Harian (Clock-In / Clock-Out)

- **Aktor utama:** Peserta Magang.
- **Deskripsi:** Peserta merekam kehadiran harian dengan waktu dari server. Presensi hadir dilengkapi foto dan lokasi; presensi sakit/izin dilengkapi dokumen pendukung.
- **Prasyarat:** Peserta sudah login dan memiliki aplikasi magang berstatus aktif. Hari tersebut merupakan hari presensi yang dibuka sistem.
- **Kondisi akhir:** Presensi harian tersimpan dengan `clock_in_at`; jika clock-out dilakukan, `clock_out_at` juga tersimpan. Presensi hadir menunggu tinjauan mentor.
- **Alur utama:**
  1. Peserta membuka halaman presensi hari ini dan memilih status hadir, sakit, atau izin.
  2. Untuk status hadir, peserta mengirim foto selfie dan koordinat GPS.
  3. Sistem memeriksa konfigurasi lokasi kantor dan menghitung jarak peserta dari kantor.
  4. Jika masih dalam radius yang ditentukan, sistem menyimpan presensi dengan waktu clock-in dari server, lokasi, foto, dan status persetujuan awal.
  5. Untuk sakit atau izin, peserta mengunggah dokumen pendukung dan keterangan yang diwajibkan; sistem menyimpan presensi beserta waktu clock-in.
  6. Saat peserta melakukan clock-out, sistem memastikan presensi hari itu sudah memiliki clock-in dan belum memiliki clock-out.
  7. Sistem mencatat `clock_out_at` dari waktu server dan menampilkan data presensi yang diperbarui.
- **Alur alternatif:**
  - **A1 — Hari libur atau presensi ditutup:** Sistem menolak clock-in maupun clock-out dan menampilkan alasan penutupan.
  - **A2 — Presensi hari itu sudah dikirim:** Sistem menolak duplikasi presensi.
  - **A3 — Foto, koordinat, atau konfigurasi lokasi tidak tersedia:** Untuk status hadir, sistem menolak clock-in dan meminta persyaratan dilengkapi.
  - **A4 — Di luar radius kantor:** Sistem menolak presensi hadir dan menampilkan batas radius yang berlaku.
  - **A5 — Dokumen sakit/izin atau keterangan wajib tidak tersedia:** Sistem menolak pengiriman sampai persyaratan tersebut dilengkapi.
  - **A6 — Belum clock-in atau sudah clock-out:** Sistem menolak clock-out dan memberi tahu kondisi yang perlu diperbaiki.

## UC-03 — Mengisi Logbook Harian

- **Aktor utama:** Peserta Magang.
- **Deskripsi:** Peserta mengirim catatan kegiatan harian untuk ditinjau oleh mentor atau petugas yang berwenang.
- **Prasyarat:** Peserta sudah login dan memiliki aplikasi magang berstatus aktif.
- **Kondisi akhir:** Entri logbook tersimpan terkait `intern_application_id` dan memiliki status verifikasi awal `pending`.
- **Alur utama:**
  1. Peserta memilih tanggal kegiatan yang sudah terjadi.
  2. Peserta mengisi deskripsi kegiatan dengan panjang minimal yang ditetapkan sistem.
  3. Peserta dapat memilih kategori dan mengunggah lampiran pendukung.
  4. Sistem memvalidasi tanggal, deskripsi, serta format dan ukuran lampiran.
  5. Sistem menyimpan logbook untuk aplikasi magang aktif peserta dengan status `pending`.
  6. Sistem menampilkan logbook yang berhasil dikirim.
- **Alur alternatif:**
  - **A1 — Tanggal di masa depan atau input tidak valid:** Sistem menolak pengiriman dan menampilkan kesalahan validasi.
  - **A2 — Lampiran tidak sesuai format atau batas ukuran:** Sistem menolak lampiran dan meminta peserta mengunggah berkas yang sesuai.
  - **A3 — Tidak ada aplikasi magang aktif:** Sistem tidak menyimpan logbook dan meminta peserta menghubungi pengelola magang.

## UC-04 — Memvalidasi Logbook Harian

- **Aktor utama:** Pembimbing Lapangan (Mentor).
- **Aktor pendukung:** Admin Kepegawaian.
- **Deskripsi:** Mentor atau Admin Kepegawaian meninjau isi logbook, lalu menyetujui atau menolaknya dengan catatan opsional.
- **Prasyarat:** Aktor sudah login dan memiliki peran yang diizinkan. Mentor hanya dapat memvalidasi logbook peserta dari bidangnya.
- **Kondisi akhir:** Status logbook menjadi `approved` atau `rejected`, tersimpan bersama catatan dan identitas pemeriksa.
- **Alur utama:**
  1. Aktor membuka daftar logbook dan memilih entri yang akan diperiksa.
  2. Sistem menampilkan tanggal, deskripsi, lampiran, status, dan catatan sebelumnya.
  3. Aktor memeriksa kegiatan dan lampiran, lalu memilih disetujui atau ditolak.
  4. Aktor menambahkan catatan mentor bila diperlukan.
  5. Sistem memeriksa kewenangan aktor terhadap entri tersebut.
  6. Sistem menyimpan keputusan, catatan, dan `verified_by`, lalu menampilkan status terbaru.
- **Alur alternatif:**
  - **A1 — Mentor tidak berwenang atas bidang peserta:** Sistem menolak akses dan tidak mengubah logbook.
  - **A2 — Status keputusan tidak valid:** Sistem menolak perubahan dan meminta aktor memilih `approved` atau `rejected`.

## UC-05 — Memberikan Penilaian Evaluasi (4 Kriteria)

- **Aktor utama:** Pembimbing Lapangan (Mentor).
- **Deskripsi:** Mentor memberikan evaluasi akhir atas disiplin, kualitas, softskill, dan tanggung jawab peserta. Sistem menyimpan skor rubrik, menghitung nilai akhir, serta menentukan predikat.
- **Prasyarat:** Mentor sudah login dan berwenang membimbing peserta. Peserta memiliki permohonan yang diterima dan periode magangnya telah berakhir.
- **Kondisi akhir:** Evaluasi terkait aplikasi magang tersimpan, berisi skor rubrik, persentase kehadiran, nilai akhir, predikat, catatan, dan waktu evaluasi. Status magang diperbarui menjadi selesai.
- **Alur utama:**
  1. Mentor memilih peserta yang dibimbing dan melihat metrik perkembangan yang tersedia.
  2. Mentor mengisi empat skor pada rentang 1–100: disiplin, kualitas, inisiatif/tanggung jawab, dan kerja sama/softskill.
  3. Mentor dapat menambahkan catatan evaluasi.
  4. Sistem memeriksa kewenangan mentor, status penerimaan, berakhirnya periode magang, dan rentang skor.
  5. Sistem menghitung nilai akhir sebagai rata-rata empat skor dan menetapkan predikat berdasarkan rentang nilai.
  6. Sistem menyimpan evaluasi menggunakan `intern_application_id`, memperbarui status magang menjadi selesai, dan menampilkan hasil.
- **Alur alternatif:**
  - **A1 — Mentor bukan pembimbing yang berwenang atau berbeda bidang:** Sistem menolak penyimpanan evaluasi.
  - **A2 — Periode magang belum berakhir atau permohonan belum diterima:** Sistem menolak evaluasi akhir.
  - **A3 — Skor di luar rentang atau tidak lengkap:** Sistem menolak input dan meminta mentor melengkapi skor 1–100.
  - **A4 — Metrik hari kerja tidak dapat dihitung:** Sistem menampilkan kegagalan perhitungan dan tidak menyimpan evaluasi.

> **Pemetaan skor pada implementasi saat ini:** formulir mengirim `score_discipline`, `score_quality`, `score_initiative`, dan `score_teamwork`. Nilai inisiatif disimpan juga pada `score_responsibility`, sementara nilai kerja sama disimpan juga pada `score_softskill`. Nilai akhir saat ini dihitung dari empat input formulir tersebut.

## UC-06 — Mengunduh Sertifikat Magang

- **Aktor utama:** Peserta Magang.
- **Aktor pendukung:** Mentor atau Admin Kepegawaian menerbitkan sertifikat sebelum peserta mengunduhnya.
- **Deskripsi:** Peserta mengakses sertifikat digital yang telah diterbitkan dan mengunduhnya sebagai PDF.
- **Prasyarat:** Peserta sudah login, aplikasi magang telah selesai, evaluasi akhir tersedia, dan sertifikat sudah diterbitkan.
- **Kondisi akhir:** Berkas PDF sertifikat diunduh oleh peserta. Data sertifikat tetap tersimpan dan dapat diverifikasi melalui QR/hash publik.
- **Alur utama:**
  1. Peserta membuka menu sertifikat atau memilih endpoint unduh sertifikat.
  2. Sistem mencari sertifikat milik peserta berdasarkan aplikasi magangnya.
  3. Sistem memuat data peserta, bidang, evaluasi, nomor sertifikat, waktu terbit, dan QR/hash.
  4. Sistem membentuk PDF sertifikat dan mengirimkannya sebagai unduhan.
- **Alur alternatif:**
  - **A1 — Sertifikat belum diterbitkan:** Sistem menampilkan bahwa sertifikat belum tersedia.
  - **A2 — Sertifikat atau peserta tidak ditemukan:** Sistem menolak permintaan unduhan.
  - **A3 — Pengguna mencoba mengunduh sertifikat milik peserta lain:** Sistem membatasi akses sesuai otorisasi endpoint.

## Catatan cakupan

- Diagram mencakup lima aktor dan daftar fitur yang diminta. Beberapa aktivitas pelaporan Kadis atau pengelolaan data dipresentasikan sebagai use case tingkat tujuan; detail implementasinya bergantung pada endpoint dan antarmuka yang tersedia.
- Evaluasi menyebut empat kriteria bisnis. Pada formulir backend/frontend saat ini, nama rubrik input adalah disiplin, kualitas, inisiatif, dan kerja sama; keduanya dipetakan ke kolom tanggung jawab dan softskill saat disimpan.
- Status awal logbook adalah `pending`; status presensi hadir menunggu persetujuan mentor. Istilah status pada dokumen mengikuti nilai yang digunakan backend.
