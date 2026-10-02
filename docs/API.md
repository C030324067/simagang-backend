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
Authorization: Bearer 1|token-anda
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

Validasi Laravel dapat mengembalikan HTTP `422` dengan rincian kesalahan pada `errors`. Endpoint daftar menggunakan paginator Laravel di dalam `data` (`current_page`, `data`, `per_page`, `total`, dan tautan halaman). Berkas yang diminta untuk diunduh dikembalikan sebagai respons unduhan, bukan JSON.

Pengecualian: kode tracking yang tidak ditemukan mengembalikan JSON `404` dengan field `message` tanpa envelope `success`/`data`.

## Autentikasi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | Publik | Membuat akun intern dan token |
| POST | `/auth/login` | Publik | Login dan menerbitkan token |
| POST | `/auth/logout` | Login | Mencabut token aktif |
| GET | `/auth/me` | Login | Profil pengguna beserta relasi |

### Register

Body JSON:

```json
{
  "name": "Nama Peserta",
  "email": "peserta@example.com",
  "password": "rahasia123",
  "no_hp": "08123456789"
}
```

`name`, `email`, dan `password` wajib. Email harus unik dan valid; kata sandi minimal 6 karakter. `no_hp` opsional. Akun dibuat dengan role `applicant` dan status akun `pending`; pelamar yang belum disetujui tidak dapat login. Pendaftaran pengajuan beserta dokumen dan kode tracking menggunakan endpoint publik `/applications/register` yang dijelaskan di bawah.

### Login

```json
{
  "email": "peserta@example.com",
  "password": "rahasia123"
}
```

Respons sukses memuat `data.user` dan `data.token`. Gunakan token tersebut pada endpoint terproteksi.

## Bidang/divisi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/divisions` | Publik | Daftar divisi termasuk jumlah pengajuan |

## Pengajuan magang

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/applications/my-application` | Intern | Pengajuan terbaru milik sendiri |
| POST | `/applications/register` | Publik | Membuat akun/pengajuan dan mengembalikan kode tracking |
| GET | `/applications/track/{trackingCode}` | Publik dengan kode tracking | Melihat status terbatas pengajuan |
| GET | `/applications/track/{trackingCode}/letter` | Publik dengan URL bertanda tangan | Mengunduh surat penerimaan; URL diterbitkan oleh endpoint tracking |
| POST | `/applications/submit` | Intern | Mengirim pengajuan (endpoint kompatibilitas lama) |
| GET | `/applications` | Kepegawaian, Kabid, Kadis, Mentor | Daftar pengajuan; Kabid/Mentor dibatasi ke divisinya jika memiliki `division_id` |
| GET | `/applications/{application}` | Login | Detail; intern hanya dapat melihat pengajuan sendiri, Kabid/Mentor hanya divisinya |
| GET | `/applications/kepegawaian` | Admin Kepegawaian | Antrean Kepegawaian |
| GET | `/applications/kabid` | Kabid | Antrean tinjauan bidang |
| GET | `/applications/kadis` | Kadis | Antrean persetujuan Kadis |
| GET | `/applications/pending-kepegawaian` | Admin Kepegawaian | Pengajuan menunggu verifikasi Kepegawaian |
| PUT | `/applications/{application}/approve-kepegawaian` | Admin Kepegawaian | Menyetujui/menolak tahap Kepegawaian |
| GET | `/applications/pending-kabid` | Kabid | Pengajuan menunggu tinjauan Kabid |
| PUT | `/applications/{application}/approve-kabid` | Kabid | Menyetujui/menolak tahap Kabid |
| GET | `/applications/pending-kadis` | Kadis | Pengajuan menunggu keputusan Kadis |
| PUT | `/applications/{application}/approve-kadis` | Kadis | Otorisasi atau menolak; Kadis tidak mengisi nomor surat |
| PUT | `/applications/{application}/status` | Admin Kepegawaian, Kabid, Kadis | Transisi status workflow |
| GET | `/applications/pending-letters` | Admin Kepegawaian | Pengajuan yang menunggu surat resmi |
| PUT | `/applications/{application}/issue-letter` | Admin Kepegawaian | Mengisi nomor surat dan menerbitkan PDF setelah otorisasi Kadis |
| POST | `/applications/{application}/upload-letter` | Admin Kepegawaian | Alias lama penerbitan surat |
| POST | `/applications/{application}/official-letter` | Admin Kepegawaian | Alias lama penerbitan surat |
| GET | `/applications/{application}/official-letter` | Intern pemilik | Unduh surat penerimaan setelah diterima |

### Pendaftaran dan pelacakan publik

Kirim pendaftaran sebagai `multipart/form-data` ke `/applications/register`. Field wajib: `application_type` (`mandiri` atau `rekomendasi_kampus`), `nama`, `email`, `bidang` (`Aptika`, `Statistika`, atau `IKP`), `institusi`, `jurusan`, `hp`, `tgl_mulai`, `tgl_selesai`, `pw`, `pw2`, serta file `b1`, `b2`, `b3`, dan `b4`. Untuk `rekomendasi_kampus`, `recommendation_letter_number` juga wajib. `pw` minimal 8 karakter dan harus sama dengan `pw2`; berkas dibatasi 5 MB. `b1`, `b2`, dan `b3` menerima PDF/JPG/JPEG/PNG; `b4` menerima JPG/JPEG/PNG.

Respons `201` mengandung `tracking_code` (juga tersedia pada `data.tracking_code`). Simpan kode tersebut. Gunakan `GET /applications/track/{trackingCode}` tanpa login untuk membaca `status`, `rejected_at_stage`, `rejection_reason`, dan `acceptance_letter_url`. Kode yang tidak dikenal menghasilkan `404` dengan pesan `Kode tracking tidak ditemukan. Silakan periksa kembali kode Anda.` Ketika diterima, buka `acceptance_letter_url` untuk mengunduh surat tanpa login; URL bertanda tangan berlaku 30 hari.

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

### Persetujuan

Endpoint `PUT /applications/{application}/approve-kepegawaian` menerima `status` (`approved` atau `rejected`), `division_id` wajib saat menyetujui, dan `notes` opsional (maksimal 1000 karakter). Endpoint `approve-kabid` dan `approve-kadis` menerima `status` yang sama dan `notes` opsional. Persetujuan Kadis hanya mengubah status ke `approved_by_kadis`; Kadis tidak mengisi nomor atau berkas surat.

Endpoint workflow utama `PUT /applications/{application}/status` menerima:

```json
{
  "status": "pending_kabid",
  "division_id": 2
}
```

Nilai `status` kanonis: `pending_kabid`, `pending_kadis`, `approved_by_kadis`, atau `rejected`. Alias kompatibilitas `review_kabid`, `review_kadis`, dan `approved_kadis` juga diterima. Transisi mengikuti peran dan status saat ini: Kepegawaian meneruskan ke Kabid (dengan `division_id`) atau menolak; Kabid meneruskan ke Kadis atau menolak; Kadis mengotorisasi saja (status `approved_by_kadis`) atau menolak. Saat menolak, `rejection_note` boleh disertakan (maksimal 2000 karakter).

### Penerbitan surat resmi

Admin Kepegawaian memproses pengajuan berstatus `approved_by_kadis` dari antrean `GET /applications/pending-letters`. `PUT /applications/{application}/issue-letter` menerima `official_letter_number` (wajib, unik) dan `official_letter` (PDF, maksimal 10 MB) sebagai `multipart/form-data`. Penerbitan mengubah status menjadi `accepted`, mengaktifkan akun intern, dan membuat surat tersedia melalui kode tracking publik. Endpoint POST lama `upload-letter` dan `official-letter` memakai validasi yang sama.

## Presensi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/attendances` | Login | Daftar presensi; intern hanya melihat miliknya |
| GET | `/attendances/today` | Intern | Presensi hari ini |
| POST | `/attendances/check-in` | Intern | Check-in hadir/sakit/izin yang menunggu persetujuan mentor |
| POST | `/attendances/check-out` | Intern | Check-out dengan waktu server |
| GET | `/attendances/pending-approval` | Mentor | Antrean presensi peserta satu divisi |
| GET | `/attendances/{attendance}/files/{kind}` | Mentor | Melihat `selfie` atau `attachment` peserta satu divisi |
| PUT | `/attendances/{attendance}/review` | Mentor | Menyetujui atau menolak presensi |

`GET /attendances` menerima filter `user_id`, `month`, `year`, dan `per_page` (default 20). Check-in dikirim dengan `multipart/form-data`; field `status` wajib bernilai `present`, `sick`, atau `leave`. Untuk `present`, `photo` wajib diambil langsung dari kamera pada frontend, serta `latitude` dan `longitude` wajib. Backend memeriksa jarak terhadap `OFFICE_LAT`/`OFFICE_LNG` dalam radius `MAX_RADIUS_METERS` (default 50 m), lalu otomatis membedakan `present`/`late` dari waktu server (batas 08:15). Untuk `sick`, lampirkan `dokumen_skd`; untuk `leave`, lampirkan `dokumen_izin` (PDF/JPG/JPEG, maksimal 5 MB). Semua pengajuan awal berstatus `pending_approval`. Check-out tidak memerlukan body dan waktunya dibuat server. Mentor meninjau dengan `{ "approval_status": "approved" }` atau `{ "approval_status": "rejected", "rejection_reason": "..." }`.

## Logbook

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/logbooks` | Login | Daftar logbook; intern hanya melihat miliknya |
| POST | `/logbooks` | Intern | Membuat entri kegiatan |
| PUT | `/logbooks/{logbook}/verify` | Mentor, Admin Kepegawaian | Memverifikasi entri |

Filter daftar: `user_id` (untuk non-intern), `verification_status`, `per_page` (default 15). Buat entri dengan `date` (wajib, tidak boleh di masa depan), `activity_description` (wajib, minimal 10 karakter), dan `attachment` opsional (PDF/JPG/JPEG/PNG/DOC/DOCX, maksimal 10 MB). Verifikasi menerima `verification_status` (`approved` atau `rejected`) dan `mentor_notes` opsional (maksimal 1000 karakter).

## Tugas

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/tasks` | Login | Daftar tugas; intern melihat tugasnya, mentor tugas yang dibuatnya |
| POST | `/tasks` | Mentor | Membuat dan menugaskan tugas |
| PUT | `/tasks/{task}/status` | Intern | Memperbarui status dan kiriman |
| GET | `/tasks/{task}/submission` | Intern pemilik atau mentor pembuat | Mengunduh kiriman |

Filter daftar: `status`, `per_page` (default 15). Pembuatan menerima `title` (wajib, maksimal 255), `description` opsional, `assigned_to` (intern terverifikasi dari divisi mentor), dan `deadline` opsional. Status tugas: `pending`, `in_progress`, `revision_needed`, `completed`; tidak ada endpoint atau nilai per tugas. Intern dapat memperbarui status ke `pending`, `in_progress`, atau `completed`; mentor pembuat tugas dapat mengatur semua status. Untuk status `completed`, catatan atau file kiriman wajib ada. `submission_file` maksimal 30 MB.

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

Setiap skor wajib 1–100; `notes` opsional, maksimal 2000 karakter. Evaluasi hanya dapat disimpan setelah tanggal akhir magang. Nilai akhir merupakan rata-rata empat kriteria berbobot sama; server mengembalikan nilai akhir, predikat, ringkasan, serta metrik. Endpoint `/evaluations/metrics/{intern}` memberi `total_tasks`, `completed_tasks`, `in_progress_tasks`, `revision_tasks`, dan `logbook_completion_percentage` (hari kerja berjalan hingga hari ini; setelah magang selesai mencakup seluruh periode).

## Sertifikat

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/certificates/my-certificate` | Intern | Sertifikat milik sendiri; `data` bernilai `null` jika belum terbit |
| POST | `/certificates/generate` | Mentor, Admin Kepegawaian | Menerbitkan sertifikat berdasarkan evaluasi intern |
| GET | `/public/verify-cert/{hash}` | Publik | Memverifikasi sertifikat melalui QR hash |

Penerbitan menerima JSON `{ "intern_id": 12 }`. Intern harus memiliki evaluasi akhir. Penerbitan kedua untuk intern yang sama mengembalikan sertifikat yang sudah ada.

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
| 409 | Status pengajuan berubah bersamaan saat diproses |
| 422 | Validasi gagal atau transisi/status tidak dapat diproses |
| 503 | Pengiriman surat/email tidak tersedia |
