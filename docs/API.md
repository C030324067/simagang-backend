# Dokumentasi API SIMAGANG

Dokumentasi ini merangkum endpoint yang didefinisikan di `routes/api.php`. Semua path menggunakan prefiks `/api`.

## Dasar penggunaan

- Ganti `https://domain-aplikasi` dengan alamat server aplikasi.
- Endpoint yang memerlukan autentikasi memakai Laravel Sanctum. Kirim token hasil login sebagai `Authorization: Bearer <token>`.
- Untuk JSON, gunakan `Accept: application/json` dan `Content-Type: application/json`. Untuk unggahan berkas gunakan `multipart/form-data`.
- Role yang dipakai API: `applicant`, `intern`, `mentor`, `admin_kepegawaian`, `kabid`, dan `kadis`.

Contoh header:

```http
Accept: application/json
Authorization: Bearer <token>
```

## Bentuk respons

Respons sukses API umumnya berbentuk:

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {}
}
```

Respons error yang dibentuk aplikasi umumnya berbentuk:

```json
{
  "success": false,
  "message": "Kredensial login tidak valid",
  "data": null
}
```

Validasi Laravel dapat mengembalikan HTTP `422` dengan bentuk standar Laravel (`message` dan `errors`), bukan envelope sukses/error aplikasi. Endpoint daftar yang dipaginasi menggunakan paginator Laravel di dalam `data` (`current_page`, `data`, `per_page`, `total`, dan tautan halaman); beberapa antrean workflow mengembalikan array langsung di dalam `data`. Berkas yang diminta untuk diunduh dikembalikan sebagai respons file, bukan JSON.

Pengecualian: pendaftaran publik `/applications/register` memakai field `status` (bukan `success`) dan mengembalikan `tracking_code` di level teratas serta di dalam `data`. Kode tracking yang tidak ditemukan mengembalikan JSON `404` dengan field `message` tanpa envelope `success`/`data`.

## Autentikasi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | Publik | Membuat akun applicant berstatus pending; tidak menerbitkan token |
| POST | `/auth/login` | Publik | Login dan menerbitkan token |
| POST | `/auth/forgot-password` | Publik | Meminta tautan reset password |
| POST | `/auth/reset-password` | Publik | Mengatur password menggunakan token reset |
| POST | `/auth/logout` | Login | Mencabut token aktif |
| GET | `/auth/me` | Login | Profil pengguna beserta relasi |
| POST | `/change-password` | Login | Mengganti password sendiri |
| POST | `/users/{user}/approve` | Admin Kepegawaian, Kadis | Menyetujui applicant dan mengaktifkan akun intern |

### Pendaftaran akun

Body JSON:

```json
{
  "name": "Nama Peserta",
  "email": "peserta@example.com",
  "password": "rahasia123",
  "no_hp": "08123456789"
}
```

`name`, `email`, dan `password` wajib. Email harus unik dan valid; kata sandi minimal 6 karakter. `no_hp` opsional (maksimal 20 karakter). Akun dibuat dengan role `applicant` dan status akun `pending`. Endpoint ini tidak menerbitkan token, dan applicant berstatus pending tidak dapat login. Pendaftaran pengajuan magang beserta dokumen dan kode tracking menggunakan endpoint publik `/applications/register` di bawah.

### Login

```json
{
  "email": "peserta@example.com",
  "password": "rahasia123"
}
```

Respons sukses memuat `data.user` dan `data.token`. Gunakan token tersebut pada endpoint terproteksi.

### Reset dan ganti password

- `POST /auth/forgot-password` menerima JSON `{ "email": "peserta@example.com" }`. Respons tidak mengungkap apakah email terdaftar. Dibatasi 5 permintaan per menit.
- `POST /auth/reset-password` menerima `token`, `email`, `password`, dan `password_confirmation`. Password minimal 8 karakter dan kedua field password harus cocok. Token akses lama pengguna dicabut setelah reset. Dibatasi 5 permintaan per menit.
- `POST /change-password` memerlukan autentikasi dan menerima `current_password`, `new_password`, serta `new_password_confirmation`. Password baru minimal 8 karakter. Endpoint ini dibatasi 5 permintaan per menit.

### Persetujuan akun applicant

`POST /users/{user}/approve` hanya dapat dipakai Admin Kepegawaian atau Kadis. Tidak memerlukan body. Hanya akun ber-role `applicant` dengan `status_akun: pending` yang dapat disetujui; hasilnya role berubah menjadi `intern` dan status akun menjadi `approved`. Ini berbeda dari persetujuan pengajuan magang berjenjang.

### Akun uji dari seeder (lokal saja)

Akun berikut dibuat oleh `php artisan db:seed` untuk pengembangan lokal. Semua akun yang dibuat seeder memakai password `password123`. **Jangan gunakan atau deploy password ini di staging/production**; seeder akan membuat akun dengan email tetap dan password bersama tersebut.

Password untuk semua akun di daftar ini: `password123`.
Email Kabid dan Mentor memakai format berbasis role dan divisi.

**Kadis**
- Divisi: tidak berlaku
- Email: `kadis@diskominfo.go.id`

**Admin Kepegawaian**
- Email: `kepegawaian@diskominfo.go.id`
- Password: ditentukan saat akun dibuat di environment; tidak diatur oleh seeder default.

**Kabid**
- IKP — `kabid.ikp@diskominfo.go.id`
- Statistik — `kabid.statistik@diskominfo.go.id`
- Aptika — `kabid.aptika@diskominfo.go.id`
- TKI — `kabid.tki@diskominfo.go.id`

**Mentor**
- IKP — `mentor1.ikp@diskominfo.go.id`, `mentor2.ikp@diskominfo.go.id`, `mentor3.ikp@diskominfo.go.id`, `mentor4.ikp@diskominfo.go.id`
- Statistik — `mentor1.statistik@diskominfo.go.id`, `mentor2.statistik@diskominfo.go.id`, `mentor3.statistik@diskominfo.go.id`
- Aptika — `mentor1.aptika@diskominfo.go.id`, `mentor2.aptika@diskominfo.go.id`, `mentor3.aptika@diskominfo.go.id`, `mentor4.aptika@diskominfo.go.id`, `mentor5.aptika@diskominfo.go.id`
- TKI — `mentor1.tki@diskominfo.go.id`, `mentor2.tki@diskominfo.go.id`
- Catatan: akun `kabid.tki@diskominfo.go.id` tetap ber-role `kabid` dan tetap tersedia sebagai pembimbing utama divisi TKI, tetapi akun mentor TKI khusus juga dibuat untuk login sebagai role `mentor`.

Seeder default tidak membuat akun `admin_kepegawaian`, `applicant`, atau `intern`. Email `kepegawaian@diskominfo.go.id` adalah alamat akun Admin Kepegawaian yang digunakan oleh environment, tetapi akun harus sudah dibuat/provisioned di database agar dapat login; passwordnya tidak ditentukan seeder ini. Akun applicant dibuat melalui pendaftaran dan berstatus pending sehingga belum bisa login. Akun menjadi intern setelah alur pengajuan diterima dan surat resmi diterbitkan, atau setelah disetujui melalui endpoint akun di atas; gunakan email dan password yang dipilih saat pendaftaran. Jangan mengirim akun/password lokal di atas kepada frontend untuk koneksi ke server bersama; buat akun uji tersendiri di environment frontend.

## Bidang/divisi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/divisions` | Publik | Daftar divisi master, kuota tersisa, dan Kabid aktif jika ada |

Respons `data` berupa array divisi. Setiap item memiliki `id`, `name`, `code`, `description`, `quota`, `active_applications_count`, `remaining_quota`, dan `active_kabid` (objek berisi `id`, `name`, `position`, `division_id`, atau `null`). Daftar bidang tidak dikunci di frontend; konsumen memakai data endpoint ini. Master saat ini berisi:

| `code` | Nama divisi |
|---|---|
| `ikp` | Bidang Informasi dan Komunikasi Publik (IKP) |
| `statistik` | Bidang Statistik |
| `aptika` | Bidang Aplikasi Informatika |
| `tki` | Bidang Telekomunikasi dan Keamanan Informasi |

## Pengajuan magang

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/applications/my-application` | Intern | Pengajuan terbaru milik sendiri |
| POST | `/applications/register` | Publik | Membuat akun/pengajuan dan mengembalikan kode tracking |
| GET | `/applications/track/{trackingCode}` | Publik dengan kode tracking | Melihat status terbatas pengajuan |
| GET | `/applications/track/{trackingCode}/letter` | Publik dengan URL bertanda tangan | Mengunduh surat penerimaan; URL diterbitkan oleh endpoint tracking |
| POST | `/applications/submit` | Intern | Mengirim pengajuan (endpoint kompatibilitas lama) |
| GET | `/applications` | Admin Kepegawaian, Kabid, Kadis, Mentor | Daftar pengajuan; Kabid/Mentor dibatasi sesuai divisi dan status |
| GET | `/applications/{application}` | Login | Detail; intern hanya dapat melihat pengajuan sendiri, Kabid/Mentor hanya divisinya |
| GET | `/applications/kepegawaian` | Admin Kepegawaian | Antrean Kepegawaian |
| GET | `/applications/{application}/documents/{document}` | Admin Kepegawaian | Membuka dokumen pengajuan |
| GET | `/applications/kabid` | Kabid | Antrean tinjauan bidang |
| GET | `/applications/{application}/mentors` | Kabid | Daftar mentor yang dapat dipilih untuk pengajuan |
| GET | `/applications/kadis` | Kadis | Antrean persetujuan Kadis |
| GET | `/applications/pending-kepegawaian` | Admin Kepegawaian | Pengajuan menunggu verifikasi Kepegawaian |
| PUT | `/applications/{application}/approve-kepegawaian` | Admin Kepegawaian | Menyetujui/menolak tahap Kepegawaian |
| GET | `/applications/pending-kabid` | Kabid | Pengajuan menunggu tinjauan Kabid |
| PUT | `/applications/{application}/approve-kabid` | Kabid | Menyetujui/menolak tahap Kabid |
| GET | `/applications/pending-kadis` | Kadis | Pengajuan menunggu keputusan Kadis |
| PUT | `/applications/{application}/approve-kadis` | Kadis | Otorisasi atau menolak; Kadis tidak mengisi nomor surat |
| PUT | `/applications/{application}/status` | Admin Kepegawaian, Kabid, Kadis | Transisi status workflow |
| GET | `/applications/pending-letters` | Admin Kepegawaian | Pengajuan yang menunggu surat resmi |
| PUT | `/applications/{application}/issue-letter` | Admin Kepegawaian | Mengisi nomor surat dan menerbitkan surat setelah otorisasi Kadis |
| POST | `/applications/{application}/upload-letter` | Admin Kepegawaian | Alias lama penerbitan surat |
| POST | `/applications/{application}/official-letter` | Admin Kepegawaian | Alias lama penerbitan surat |
| GET | `/applications/{application}/official-letter` | Intern pemilik | Unduh surat penerimaan setelah diterima |

Dashboard Admin Kepegawaian dan Kabid menyediakan unduhan PDF surat balasan pada daftar peserta yang sudah diterima. Endpoint `GET /pendaftaran/{id}/cetak-surat` menggunakan token Sanctum dan hanya dapat diakses Admin Kepegawaian atau Kabid (Kabid dibatasi ke divisinya). NIM/NISN dicatat pada field `nim_nisn` saat pendaftaran dan ditampilkan pada surat; data pendaftar lama yang belum memilikinya ditampilkan sebagai `-`.

`GET /applications` menerima filter opsional `final_status`, `division_id`, `application_type`, dan `per_page` (default 15). Akses Kabid dibatasi ke pengajuan applicant di divisinya; Mentor hanya melihat pengajuan yang sudah diterima dan intern aktif yang berada di divisinya. `GET /applications/{application}` mengembalikan detail beserta user, divisi, dan verifikator tahap workflow.

### Pendaftaran dan pelacakan publik

Kirim pendaftaran sebagai `multipart/form-data` ke `/applications/register`. Field wajib: `application_type` (`mandiri` atau `rekomendasi_kampus`), `nama`, `email`, `bidang`, `institusi`, `jurusan`, `hp`, `tgl_mulai`, `tgl_selesai`, `pw`, `pw2`, serta file `b1`, `b2`, `b3`, dan `b4`. Nilai `bidang` memakai `code` yang dikembalikan `GET /divisions` (saat ini `ikp`, `statistik`, `aptika`, atau `tki`); alias lama `Aptika`, `Statistika`, dan `IKP` masih diterima untuk kompatibilitas. Bidang yang tidak ditemukan atau kuotanya habis ditolak dengan HTTP `422`. Untuk `rekomendasi_kampus`, `recommendation_letter_number` juga wajib. `pw` minimal 8 karakter dan harus sama dengan `pw2`; berkas dibatasi 5 MB. `b1`, `b2`, dan `b3` menerima PDF/JPG/JPEG/PNG; `b4` menerima JPG/JPEG/PNG.

Pemetaan berkas: `b1` disimpan sebagai proposal/surat pengantar; `b2` sebagai CV; `b3` sebagai surat rekomendasi untuk `rekomendasi_kampus` atau transkrip untuk `mandiri`; `b4` sebagai kartu mahasiswa. Pemetaan ini mengikuti tipe pengajuan.

Kepegawaian memilih divisi menggunakan `division_id` dari daftar master. Setelah diteruskan, antrean Kabid dan pilihan mentor dibatasi ke divisi yang sama; kuota diperiksa pada saat persetujuan.

Respons `201` pendaftaran memiliki bentuk:

```json
{
  "status": "success",
  "message": "Pendaftaran berhasil! Berkas Anda sedang ditinjau oleh pihak Diskominfo. Akun Anda akan diaktifkan setelah pendaftaran DITERIMA.",
  "redirect_url": "https://domain-aplikasi/login",
  "tracking_code": "TRK-XXXXXXXXXXXX",
  "data": {
    "tracking_code": "TRK-XXXXXXXXXXXX",
    "status": "pending_kepegawaian"
  }
}
```

Simpan `tracking_code`. Gunakan `GET /applications/track/{trackingCode}` tanpa login untuk membaca `status`, `rejected_at_stage`, `rejection_reason`, dan `acceptance_letter_url`. Respons sukses memakai `{ "success": true, "data": { ... } }`; kode tidak dikenal menghasilkan `404` dengan `message` saja. Ketika diterima dan surat telah diterbitkan, buka `acceptance_letter_url` untuk mengunduh surat tanpa login; URL bertanda tangan berlaku 30 hari. Pendaftaran dibatasi 5 permintaan per menit; pelacakan 30 permintaan per menit dan unduhan URL bertanda tangan 10 permintaan per menit.

Untuk membuka dokumen yang diunggah, Admin Kepegawaian dapat menggunakan `GET /applications/{application}/documents/{document}` dengan `{document}` salah satu dari `proposal`, `cv`, `transcript`, atau `student-card`. Respons berupa file inline; dokumen yang tidak tersedia menghasilkan `404`.

Kabid dapat mengambil pilihan pembimbing melalui `GET /applications/{application}/mentors`. Respons `data` berisi `{id, name, role}`; hasil dibatasi ke divisi Kabid, dan dapat mencakup Kabid itu sendiri jika memenuhi syarat.

### Mengirim pengajuan (endpoint kompatibilitas)

Kirim sebagai `multipart/form-data` ke `/applications/submit`:

| Field | Aturan |
|---|---|
| `application_type` | Wajib: `mandiri` atau `rekomendasi_kampus` |
| `institution_name` | Wajib, teks maksimal 255 karakter |
| `start_date` | Wajib, tanggal hari ini atau setelahnya |
| `end_date` | Wajib, setelah `start_date` |
| `division_id` | Opsional, harus ID divisi yang tersedia |
| `file_proposal` | PDF; wajib untuk kedua jenis, maksimal 10 MB |
| `file_cv` | PDF; wajib untuk `mandiri`, maksimal 5 MB |
| `file_recommendation_letter` | PDF; wajib untuk `rekomendasi_kampus`, maksimal 5 MB |
| `recommendation_letter_number` | Wajib untuk `rekomendasi_kampus`, maksimal 255 karakter |

`end_date` harus setelah `start_date`. Endpoint ini adalah jalur kompatibilitas terproteksi untuk role `intern`; respons memakai envelope sukses standar.

### Persetujuan

Endpoint `PUT /applications/{application}/approve-kepegawaian` menerima JSON `status` (`approved` atau `rejected`), `division_id` wajib saat menyetujui, dan `notes` opsional (maksimal 1000 karakter). Endpoint `PUT /applications/{application}/approve-kabid` menerima `status`, `notes` opsional, dan `mentor_id` wajib saat menyetujui. `mentor_id` harus berupa akun mentor aktif dalam divisi Kabid, atau akun Kabid itu sendiri jika memenuhi syarat. Endpoint `PUT /applications/{application}/approve-kadis` menerima `status` dan `notes` opsional. Persetujuan Kadis hanya mengubah status ke `approved_by_kadis`; Kadis tidak mengisi nomor atau berkas surat.

Endpoint workflow utama `PUT /applications/{application}/status` menerima:

```json
{
  "status": "pending_kabid",
  "division_id": 2
}
```

Nilai `status` yang diterima: `pending_kabid`, `pending_kadis`, `approved_by_kadis`, `rejected`, serta alias `review_kabid`, `review_kadis`, dan `approved_kadis` (alias dinormalisasi ke nilai kanonis). Kepegawaian meneruskan ke Kabid dengan `division_id` atau menolak. Kabid meneruskan ke Kadis dengan `mentor_id` wajib, atau menolak. Kadis mengotorisasi saja (status `approved_by_kadis`) atau menolak. Saat menolak, `rejection_note` opsional (maksimal 2000 karakter). Transisi dibatasi oleh role dan status pengajuan saat ini; konflik perubahan status dapat menghasilkan `409`.

### Penerbitan surat resmi

Admin Kepegawaian memproses pengajuan berstatus `approved_by_kadis` dari antrean `GET /applications/pending-letters`. `PUT /applications/{application}/issue-letter` menerima `official_letter_number` (wajib, unik) dan file `official_letter_file` (wajib, PDF/JPG/JPEG/PNG, maksimal 10 MB) sebagai `multipart/form-data`. Alias `letter_number` dan file `file` juga diterima untuk kompatibilitas. Endpoint POST lama `upload-letter` dan `official-letter` menggunakan validasi yang sama. Surat hanya dapat diterbitkan jika pengajuan memiliki divisi dan kuota masih tersedia. Penerbitan mengubah status menjadi `accepted`, mengaktifkan akun intern, dan membuat surat tersedia melalui kode tracking publik. Email dapat dikirim jika konfigurasi mail aktif; jika tidak, peserta tetap dapat mengunduh melalui pelacak.

## Presensi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/attendances` | Login | Daftar presensi; intern hanya melihat miliknya |
| GET | `/attendances/summary` | Intern, Mentor | Ringkasan kehadiran peserta magang |
| GET | `/attendances/today` | Intern | Presensi hari ini |
| POST | `/attendances/check-in` | Intern | Check-in hadir/sakit/izin yang menunggu persetujuan mentor |
| POST | `/attendances/check-out` | Intern | Check-out dengan waktu server |
| GET | `/attendances/pending-approval` | Mentor | Antrean presensi peserta satu divisi |
| GET | `/attendances/{attendance}/files/{kind}` | Mentor | Mengunduh `selfie` atau `attachment` peserta satu divisi |
| PUT | `/attendances/{attendance}/review` | Mentor | Menyetujui atau menolak presensi |

`GET /attendances` menerima filter `user_id`, `month`, `year`, dan `per_page` (default 20). Intern hanya melihat miliknya; Mentor melihat presensi peserta di divisinya. `GET /attendances/summary` tanpa parameter mengembalikan ringkasan untuk intern yang login; Mentor wajib mengirim query `user_id` milik intern di divisinya. Respons `data` memuat `total_hadir`, `total_hari_kerja_efektif`, `attendance_percentage`, serta `start_date` dan `end_date` jika ada periode magang yang disetujui. Jika belum ada periode, tiga nilai pertama bernilai 0. Perhitungan hari kerja dapat menghasilkan `503` jika sumber hari libur gagal.

Check-in dikirim dengan `multipart/form-data`; field `status` wajib bernilai `present`, `sick`, atau `leave`. Untuk `present`, `photo` wajib (gambar JPG/JPEG/PNG/WEBP, maksimal 5 MB), serta `latitude` dan `longitude` wajib. Backend memeriksa jarak terhadap koordinat kantor dari konfigurasi `OFFICE_LAT`/`OFFICE_LNG` dalam radius `MAX_RADIUS_METERS` (default 50 m), lalu otomatis membedakan `present`/`late` dari waktu server (batas 08:15). Untuk `sick`, `dokumen_skd` opsional; untuk `leave`, `dokumen_izin` opsional (PDF/JPG/JPEG, maksimal 5 MB). Kedua jenis wajib memiliki `notes` (maksimal 500 karakter). Semua pengajuan awal berstatus `pending_approval`. Check-out tidak memerlukan body dan waktunya dibuat server. Mentor meninjau dengan `{ "approval_status": "approved" }` atau `{ "approval_status": "rejected", "rejection_reason": "..." }`; alasan wajib saat menolak (maksimal 2000 karakter). Lampiran presensi dapat diunduh mentor dari endpoint `files/{kind}`, dengan `kind` `selfie` atau `attachment`.

## Logbook

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/logbooks` | Login | Daftar logbook; intern hanya melihat miliknya |
| POST | `/logbooks` | Intern | Membuat entri kegiatan |
| PUT | `/logbooks/{logbook}/verify` | Mentor, Admin Kepegawaian | Memverifikasi entri |

Filter daftar: `verification_status` dan `per_page` (default 15). Admin Kepegawaian dan role lain selain intern/Mentor dapat memfilter `user_id`; Mentor otomatis melihat logbook intern satu divisi dan parameter `user_id` diabaikan. Buat entri dengan `date` (wajib, tidak boleh di masa depan), `activity_description` (wajib, minimal 10 karakter), dan `attachment` opsional (PDF/JPG/JPEG/PNG/DOC/DOCX, maksimal 10 MB). Verifikasi menerima `verification_status` (`approved` atau `rejected`) dan `mentor_notes` opsional (maksimal 1000 karakter).

## Tugas

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/tasks` | Login | Daftar tugas; intern melihat tugasnya, mentor tugas yang dibuatnya |
| POST | `/tasks` | Mentor | Membuat dan menugaskan tugas |
| PUT | `/tasks/{task}/status` | Intern pemilik atau Mentor pembuat | Memperbarui status dan kiriman |
| GET | `/tasks/{task}/submission` | Intern pemilik atau mentor pembuat | Mengunduh kiriman |

Filter daftar: `status`, `per_page` (default 15). Pembuatan menerima `title` (wajib, maksimal 255), `description` opsional, `assigned_to` (intern aktif dari divisi mentor), dan `deadline` opsional yang harus di masa depan. Status tugas: `pending`, `in_progress`, `revision_needed`, `completed`. Intern pemilik dapat memperbarui ke `pending`, `in_progress`, atau `completed`; Mentor pembuat dapat mengatur semua status. Body update menerima `status`, `submission_notes` opsional (maksimal 1000 karakter), dan `submission_file` opsional (maksimal 30 MB, jenis file apa pun). Untuk status `completed`, catatan atau file kiriman wajib tersedia (kiriman yang sudah tersimpan dapat digunakan). Kiriman dapat diunduh oleh intern pemilik atau mentor pembuat tugas.

## Evaluasi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/evaluations` | Login | Daftar evaluasi; intern/mentor dibatasi ke evaluasi terkait |
| GET | `/evaluations/{intern}` | Mentor atau intern pemilik | Evaluasi berdasarkan ID user intern |
| GET | `/evaluations/metrics/{intern}` | Mentor satu divisi atau intern pemilik | Counter tugas, kelengkapan logbook, dan presensi |
| POST | `/evaluations` | Mentor | Membuat atau memperbarui evaluasi akhir intern |

Body untuk menyimpan evaluasi:

```json
{
  "intern_id": 12,
  "score_discipline": 90,
  "score_quality": 85,
  "score_initiative": 88,
  "score_teamwork": 92,
  "notes": "Menunjukkan perkembangan yang baik."
}
```

Setiap skor wajib 1–100; `notes` opsional, maksimal 2000 karakter. Evaluasi hanya dapat disimpan mentor dari divisi intern setelah tanggal akhir magang. Nilai akhir merupakan rata-rata empat kriteria berbobot sama; server mengembalikan nilai akhir, predikat, ringkasan, serta metrik. Endpoint `/evaluations/metrics/{intern}` memberi `total_tasks`, `completed_tasks`, `in_progress_tasks`, `revision_tasks`, `filled_working_days`, `total_working_days`, `logbook_completion_percentage`, dan `attendance_percentage`. Penghitungan hari kerja mencakup hari kerja efektif sampai hari ini dalam periode magang.

## Sertifikat

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/certificates/my-certificate` | Intern | Sertifikat milik sendiri; `data` bernilai `null` jika belum terbit |
| POST | `/certificates/generate` | Mentor, Admin Kepegawaian | Menerbitkan sertifikat berdasarkan evaluasi intern |
| GET | `/public/verify-cert/{hash}` | Publik | Memverifikasi sertifikat melalui QR hash |

Penerbitan menerima JSON `{ "intern_id": 12 }`. Intern harus memiliki evaluasi akhir dan periode magang berstatus selesai (`internship_status: completed`). Penerbitan kedua untuk intern yang sama mengembalikan sertifikat yang sudah ada.

## Contoh penggunaan

```bash
curl -X POST "https://domain-aplikasi/api/auth/login" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"peserta@example.com","password":"rahasia123"}'
```

```bash
curl "https://domain-aplikasi/api/auth/me" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 1|token-anda"
```

## Status HTTP yang umum

| Status | Arti |
|---|---|
| 200 | Permintaan berhasil |
| 201 | Data berhasil dibuat |
| 401 | Belum terautentikasi atau kredensial salah |
| 403 | Tidak memiliki izin untuk tindakan tersebut |
| 404 | Data/sertifikat tidak ditemukan |
| 409 | Data berubah saat diproses secara bersamaan |
| 422 | Validasi gagal atau transisi/status tidak dapat diproses |
| 503 | Layanan atau konfigurasi eksternal yang diperlukan tidak tersedia |
| 429 | Batas permintaan per menit terlampaui |
