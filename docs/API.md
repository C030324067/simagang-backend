# Dokumentasi API SIMAGANG

Dokumentasi ini merangkum endpoint yang didefinisikan di `routes/api.php`. Semua path menggunakan prefiks `/api`.

## Dasar penggunaan

- Ganti `https://domain-aplikasi` dengan alamat server aplikasi.
- Endpoint yang memerlukan autentikasi memakai Laravel Sanctum. Kirim token hasil login sebagai `Authorization: Bearer <token>`.
- Untuk JSON, gunakan `Accept: application/json` dan `Content-Type: application/json`. Untuk unggahan berkas gunakan `multipart/form-data`; jangan menetapkan header `Content-Type` secara manual di browser agar boundary multipart dibuat otomatis.
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
| GET | `/auth/me` | Login | Profil pengguna; menyertakan `division_id` dan `division` resmi dari database |
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

`POST /users/{user}/approve` hanya dapat dipakai Admin Kepegawaian atau Kadis. Tidak memerlukan body. Hanya akun ber-role `applicant` dengan `status_akun: pending` yang dapat disetujui; hasilnya role berubah menjadi `intern`, status akun menjadi `approved`, dan `is_active` menjadi `true`. Akun pendaftar baru memiliki `is_active: false`.

`GET /auth/me` mengembalikan `data.division_id` dan relasi `data.division` (`id`, `name`, `code`). Penetapan bidang untuk Kabid bersumber dari foreign key `users.division_id`; email tidak digunakan untuk menentukan bidang.

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
| GET | `/internship-periods/current-status` | Publik | Status periode bulan/triwulan saat ini, jendela tanggal, kuota, dan kelayakan pendaftaran tiap divisi |
| GET | `/internship-periods` | Admin Kepegawaian | Daftar pengaturan periode dan kuota |
| PUT | `/internship-periods` | Admin Kepegawaian | Membuat/memperbarui kuota, tanggal, dan status aktif periode |
| DELETE | `/internship-periods/{internshipPeriod}` | Admin Kepegawaian | Menghapus pengaturan periode |

Respons `data` berupa array divisi. Setiap item memiliki `id`, `name`, `code`, `description`, `quota`, `active_applications_count`, `remaining_quota`, dan `active_kabid` (objek berisi `id`, `name`, `position`, `division_id`, atau `null`). `active_applications_count` menghitung pengajuan `final_status: accepted` yang terkait akun intern dengan `is_active: true`, per `division_id`. Daftar bidang tidak dikunci di frontend; konsumen memakai data endpoint ini. Master saat ini berisi:

| `code` | Nama divisi |
|---|---|
| `ikp` | Bidang Informasi dan Komunikasi Publik (IKP) |
| `statistik` | Bidang Statistik |
| `aptika` | Bidang Aplikasi Informatika |
| `tki` | Bidang Telekomunikasi dan Keamanan Informasi |

### Periode dan kuota pendaftaran

`GET /internship-periods/current-status` menggunakan timezone aplikasi (`Asia/Makassar`) untuk menentukan tahun, bulan, triwulan, dan hari saat ini. Setiap item `data.divisions[]` memuat `configured`, `monthly_quota`, `registered_count`, `remaining_quota`, `start_date`, `end_date`, `is_active`, `is_closed`, `division_remaining_quota`, `availability_status`, dan `can_register`. Nilai `availability_status` dapat berupa `not_configured`, `inactive`, `before_start`, `after_end`, `full`, `division_full`, atau `open`. `can_register` hanya bernilai `true` jika pengaturan bulanan tersedia, periode aktif, tanggal hari ini berada dalam rentang tanggal (inklusif), kuota bulanan tersisa, dan kuota total divisi belum habis.

`PUT /internship-periods` menerima `division_id`, `year`, `quarter`, `month`, `monthly_quota`, `start_date` (`YYYY-MM-DD`), `end_date` (`YYYY-MM-DD`, sama atau setelah tanggal mulai), dan `is_active` (boolean). Kuota dan status periode diperiksa kembali oleh endpoint pendaftaran sebelum akun atau dokumen dibuat; periode nonaktif atau di luar tanggal aktif ditolak dengan `422`. Pengaturan lama yang belum memiliki tanggal tetap berlaku tanpa batas tanggal sampai diperbarui.

## Pengajuan magang

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/applications/my-application` | Intern | Pengajuan terbaru milik sendiri |
| GET | `/kabid/interns` | Kabid | Daftar pemagang aktif, dibatasi server ke divisi Kabid |
| POST | `/applications/register` | Publik | Membuat akun/pengajuan dan mengembalikan kode tracking |
| GET | `/applications/track/{trackingCode}` | Publik dengan kode tracking | Melihat status terbatas pengajuan |
| GET | `/applications/track/{trackingCode}/letter` | Publik dengan URL bertanda tangan | Mengunduh surat penerimaan; URL diterbitkan oleh endpoint tracking |
| POST | `/applications/submit` | Intern | Mengirim pengajuan (endpoint kompatibilitas lama) |
| GET | `/applications` | Admin Kepegawaian, Kabid, Kadis, Mentor | Daftar pengajuan; Kabid/Mentor dibatasi sesuai divisi dan status |
| GET | `/applications/{application}` | Login | Detail; intern hanya dapat melihat pengajuan sendiri, Kabid/Mentor hanya divisinya |
| GET | `/applications/kepegawaian` | Admin Kepegawaian | Antrean Kepegawaian |
| GET | `/applications/{application}/documents/{document}` | Admin Kepegawaian, Kabid | Membuka dokumen pengajuan; Kabid hanya untuk divisinya |
| GET | `/applications/kabid` | Kabid | Antrean `pending_kabid` pada divisi Kabid |
| GET | `/applications/{application}/mentors` | Kabid | Daftar mentor yang dapat dipilih untuk pengajuan |
| GET | `/applications/kadis` | Kadis | Antrean persetujuan Kadis |
| GET | `/applications/pending-kepegawaian` | Admin Kepegawaian | Pengajuan menunggu verifikasi Kepegawaian |
| PUT | `/applications/{application}/approve-kepegawaian` | Admin Kepegawaian | Menyetujui/menolak tahap Kepegawaian |
| GET | `/applications/pending-kabid` | Kabid | Pengajuan menunggu tinjauan Kabid |
| PUT | `/applications/{application}/approve-kabid` | Kabid | Menyetujui/menolak tahap Kabid |
| GET | `/applications/pending-kadis` | Kadis | Pengajuan menunggu keputusan Kadis |
| PUT | `/applications/{application}/approve-kadis` | Kadis | Otorisasi atau menolak; Kadis tidak mengisi nomor surat |
| PUT | `/applications/{application}/status` | Admin Kepegawaian, Kadis | Transisi status workflow; keputusan Kabid wajib menggunakan endpoint khusus |
| GET | `/applications/pending-letters` | Admin Kepegawaian | Pengajuan yang menunggu surat resmi |
| PUT | `/applications/{application}/issue-letter` | Admin Kepegawaian | Mengisi nomor surat dan menerbitkan surat setelah otorisasi Kadis |
| POST | `/applications/{application}/upload-letter` | Admin Kepegawaian | Alias lama penerbitan surat |
| POST | `/applications/{application}/official-letter` | Admin Kepegawaian | Alias lama penerbitan surat |
| GET | `/applications/{application}/official-letter` | Intern pemilik | Unduh surat penerimaan setelah diterima |

Dashboard Admin Kepegawaian dan Kabid menyediakan unduhan PDF surat balasan pada daftar peserta yang sudah diterima. Endpoint `GET /pendaftaran/{id}/cetak-surat` menggunakan token Sanctum dan hanya dapat diakses Admin Kepegawaian atau Kabid (Kabid dibatasi ke divisinya). NIM/NISN dicatat pada field `nim_nisn` saat pendaftaran dan ditampilkan pada surat; data pendaftar lama yang belum memilikinya ditampilkan sebagai `-`.

`GET /applications` menerima filter opsional `final_status`, `division_id`, `application_type`, dan `per_page` (default 15, maksimal 100). Untuk role Kabid, backend mengabaikan filter divisi sebagai sumber otorisasi: data selalu dibatasi ke `division_id` pada akun Kabid dan status workflow `pending_kadis`, `approved_by_kadis`, `accepted`, atau `rejected_by_kabid`. Hasil Kabid memuat `status_kabid`, `notes_kabid`, `verified_by_kabid`, `kabid_decided_at`, `kabid_rejected_at`, `rejection_stage`, dan `histories`. Pagination memakai metadata Laravel (`current_page`, `data`, `first_page_url`, `from`, `last_page`, `last_page_url`, `links`, `next_page_url`, `path`, `per_page`, `prev_page_url`, `to`, `total`).

`GET /kabid/interns` menerima `page` dan `per_page` (default 15, maksimal 100); semua klausa otorisasi berdasarkan divisi Kabid yang login. `data.data[]` berisi `id`, `status`, `final_status`, `division_id`, `division` (`id`, `name`), `user` (`id`, `name`, `email`, `no_hp`, `phone`), `institution_name`, `major`, `department` (alias `major`), `start_date`, dan `end_date`. Hanya pengajuan berstatus akhir diterima dengan akun `role: intern` dan `is_active: true` yang dikembalikan.

Contoh ringkas respons daftar pemagang:

```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [{
      "id": 42,
      "status": "accepted",
      "final_status": "accepted",
      "division_id": 3,
      "division": { "id": 3, "name": "Bidang Aplikasi Informatika" },
      "user": {
        "id": 91, "name": "Nama Peserta", "email": "peserta@example.com",
        "no_hp": "08123456789", "phone": "08123456789"
      },
      "institution_name": "Universitas Tabalong",
      "major": "Teknik Informatika",
      "department": "Teknik Informatika",
      "start_date": "2026-11-01",
      "end_date": "2027-01-31"
    }],
    "per_page": 15,
    "total": 1
  }
}
```

`GET /applications/kabid` (alias workflow lama `/applications/pending-kabid`) hanya mengembalikan status tepat `pending_kabid`, bukan item yang sudah ditinjau. Menerima `page` dan `per_page` (default 15, maksimal 100), lalu memakai metadata paginator Laravel. Setiap item menyertakan pemohon, institusi, `major`, `division`, tanggal magang, `notes_kepegawaian`, dan path dokumen yang dapat dibuka lewat route dokumen. Jika akun Kabid belum mempunyai `division_id`, respons `403`.

`GET /applications/{application}` membatasi Kabid ke pengajuan pada divisi mereka (pengajuan di divisi lain menghasilkan `403`). Pengajuan Kabid yang sudah diputuskan dikembalikan oleh `GET /applications` dengan metadata keputusan serta log riwayat.

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

Untuk membuka dokumen yang diunggah, Admin Kepegawaian atau Kabid dapat menggunakan `GET /applications/{application}/documents/{document}` dengan `{document}` salah satu dari `proposal`, `cv`, `transcript`, atau `student-card`. Kabid hanya dapat membuka pengajuan yang `division_id`-nya cocok dengan relasi divisi akun login; akses silang divisi menghasilkan `403`. Role lain ditolak `403`; dokumen tidak tersedia atau jenis dokumen tidak dikenal menghasilkan `404`. Respons sukses berupa file inline.

Kabid dapat mengambil pilihan pembimbing melalui `GET /applications/{application}/mentors`. Respons `data` adalah array `{id, name, role}` yang hanya berisi akun `role: mentor`, `is_active: true`, dan `division_id` sama dengan Kabid/pengajuan. Tidak menyertakan akun Kabid. Pengajuan di divisi lain menghasilkan `403`; pengajuan yang tidak lagi `pending_kabid` menghasilkan `404`.

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

Endpoint `PUT /applications/{application}/approve-kepegawaian` menerima JSON `status` (`approved` atau `rejected`), `division_id` wajib saat menyetujui, dan `notes` opsional (maksimal 1000 karakter). Endpoint `PUT /applications/{application}/approve-kabid` menerima JSON:

```json
{
  "status": "approved",
  "notes": "Kandidat sesuai kebutuhan teknis bidang.",
  "mentor_id": 27
}
```

`status` wajib `approved` atau `rejected`; `notes` opsional dengan panjang maksimal 1000 karakter; `mentor_id` wajib saat `approved` dan harus menunjuk mentor aktif (`role: mentor`, `is_active: true`) di divisi yang sama. Saat `rejected`, `mentor_id` tidak diperlukan. Backend memeriksa `status: pending_kabid`, `status_kabid: pending`, kepemilikan divisi, dan validitas mentor; status bukan lagi pending atau kapasitas divisi penuh menghasilkan `422`, akses lintas divisi atau role bukan Kabid menghasilkan `403`, mentor tidak valid menghasilkan `422`, dan ID pengajuan yang tidak ditemukan menghasilkan `404`. Role Kabid tidak dapat memakai endpoint legacy `/applications/{application}/status`; gunakan endpoint keputusan khusus ini.

Persetujuan menghasilkan `status: pending_kadis`, `status_kabid: approved`, `mentor_id`, `notes_kabid`, `verified_by_kabid`, dan `kabid_decided_at`. Penolakan menghasilkan `status: rejected_by_kabid`, `status_kabid: rejected`, `final_status: rejected`, `rejection_stage: kabid`, `rejection_note`, `kabid_rejected_at`, serta catatan dan ID Kabid. Setiap keputusan dan baris `intern_application_histories` (`from_status`, `to_status`, `decision`, `notes`, `actor_id`, `decided_at`) disimpan dalam satu transaksi bersama pembaruan mentor/status.

Endpoint `PUT /applications/{application}/approve-kadis` menerima `status` dan `notes` opsional. Persetujuan Kadis hanya mengubah status ke `approved_by_kadis`; Kadis tidak mengisi nomor atau berkas surat.

Endpoint workflow utama `PUT /applications/{application}/status` menerima:

```json
{
  "status": "pending_kabid",
  "division_id": 2
}
```

Nilai `status` yang diterima: `pending_kabid`, `pending_kadis`, `approved_by_kadis`, `rejected`, serta alias `review_kabid`, `review_kadis`, dan `approved_kadis` (alias dinormalisasi ke nilai kanonis). Kepegawaian meneruskan ke Kabid dengan `division_id` atau menolak. Kabid meneruskan ke Kadis dengan `mentor_id` wajib, atau menolak. Kadis mengotorisasi saja (status `approved_by_kadis`) atau menolak. Saat menolak, `rejection_note` opsional (maksimal 2000 karakter). Transisi dibatasi oleh role dan status pengajuan saat ini; konflik perubahan status dapat menghasilkan `409`.

### Penerbitan surat resmi

Admin Kepegawaian juga dapat menerbitkan PDF surat balasan otomatis melalui `POST /applications/{id}/surat-balasan` dengan payload JSON `{"official_letter_number":"800/129/Diskominfo/2026"}`. Endpoint ini menyimpan PDF di `storage/app/public/letters/` dan mengembalikan `success`, `message`, serta `pdf_url`. Proses ini tidak menggantikan `issue-letter`, yang tetap mengunggah surat resmi dan mengaktifkan akun peserta.

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

Filter daftar: `verification_status` dan `per_page` (default 15). Admin Kepegawaian dan role lain selain intern/Mentor dapat memfilter `user_id`; Mentor otomatis melihat logbook intern satu divisi dan parameter `user_id` diabaikan. Buat entri dengan `date` (wajib, tidak boleh di masa depan), `activity_description` (wajib, minimal 10 karakter), `category` opsional (teks maksimal 100 karakter; frontend saat ini memakai `Kegiatan`, `Pekerjaan`, `Diskusi`, atau `Pembelajaran`), dan `attachment` opsional (PDF/JPG/JPEG/PNG/DOC/DOCX, maksimal 10 MB). Kategori disimpan dan dikembalikan pada setiap item logbook. Verifikasi menerima `verification_status` (`approved` atau `rejected`) dan `mentor_notes` opsional (maksimal 1000 karakter).

## Tugas

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/tasks` | Login | Daftar tugas; intern melihat tugasnya, mentor tugas yang dibuatnya |
| POST | `/tasks` | Mentor | Membuat dan menugaskan tugas |
| PUT | `/tasks/{task}/status` | Intern pemilik atau Mentor pembuat | Memperbarui status dan kiriman tanpa unggahan berkas |
| POST | `/tasks/{task}/status` | Intern pemilik atau Mentor pembuat | Memperbarui status menggunakan Laravel method spoofing saat multipart |
| GET | `/tasks/{task}/attachment` | Intern pemilik atau Mentor pembuat | Mengunduh berkas instruksi tugas |
| GET | `/tasks/{task}/submission` | Intern pemilik atau mentor pembuat | Mengunduh kiriman |
| GET | `/tasks/{task}/revision-file` | Intern pemilik atau Mentor pembuat | Mengunduh berkas revisi mentor |

Filter daftar: `status`, `per_page` (default 15). Pembuatan menerima `title` (wajib, maksimal 255), `description` opsional, `assigned_to` (intern aktif dari divisi mentor), `deadline` opsional yang harus di masa depan, dan `task_file` opsional (maksimal 30 MB). Status tugas: `pending`, `in_progress`, `revision_needed`, `completed`. Intern pemilik dapat memperbarui ke `pending`, `in_progress`, atau `completed`; Mentor pembuat dapat mengatur semua status. Body update menerima `status`, `submission_notes` opsional (maksimal 1000 karakter), `submission_file` opsional (maksimal 30 MB), `catatan_revisi` wajib saat status `revision_needed` (maksimal 1000 karakter), dan `revision_file` opsional (maksimal 30 MB; hanya disimpan saat status `revision_needed`). Untuk status `completed`, catatan atau file kiriman wajib tersedia (kiriman yang sudah tersimpan dapat digunakan).

Jika update mengirim berkas (`submission_file` atau `revision_file`), gunakan HTTP `POST` dengan field `_method=PUT` di dalam `FormData`. Jangan mengirim multipart langsung sebagai `PUT`/`PATCH`: PHP tidak memproses unggahannya secara konsisten. Browser harus menentukan `Content-Type` beserta boundary; jangan set header multipart secara manual.

Contoh permintaan mentor untuk meminta revisi:

```text
POST /api/tasks/12/status
Content-Type: multipart/form-data (dibuat browser)

_method=PUT
status=revision_needed
catatan_revisi=Lengkapi sumber data pada bagian kesimpulan.
revision_file=[berkas opsional, maksimal 30 MB]
```

Contoh pembuatan tugas dengan lampiran memakai `POST /api/tasks` dan `FormData` berisi `assigned_to`, `title`, `description`, `deadline` opsional, dan `task_file` opsional (maksimal 30 MB). Intern mengirim ulang hasil revisi ke `POST /api/tasks/{task}/status` dengan `_method=PUT`, `status=completed`, `submission_notes` opsional, dan `submission_file` opsional; jika status sebelumnya `revision_needed`, kiriman tersebut mengubah status ke `completed`.

## Evaluasi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/evaluations` | Login | Daftar evaluasi; intern/mentor dibatasi ke evaluasi terkait |
| GET | `/evaluations/{intern}` | Mentor atau intern pemilik | Evaluasi berdasarkan ID user intern |
| GET | `/evaluations/metrics/{intern}` | Mentor satu divisi atau intern pemilik | Counter tugas, kelengkapan logbook, dan presensi |
| POST | `/evaluations` | Mentor | Membuat atau memperbarui evaluasi akhir intern |
| POST | `/evaluations/{evaluation}/generate-certificate` | Mentor pemilik evaluasi | Menerbitkan sertifikat dari evaluasi |

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
| POST | `/certificates/generate` | Mentor, Admin Kepegawaian | Menerbitkan sertifikat berdasarkan ID intern |
| GET | `/public/verify-cert/{hash}` | Publik | Memverifikasi sertifikat melalui QR hash |

Penerbitan menerima JSON `{ "intern_id": 12 }`. Intern harus memiliki evaluasi akhir dan periode magang berstatus selesai (`internship_status: completed`). Penerbitan kedua untuk intern yang sama mengembalikan sertifikat yang sudah ada.

Untuk dashboard Mentor, gunakan `POST /evaluations/{evaluation}/generate-certificate` tanpa body. `{evaluation}` adalah ID record evaluasi dari `GET /evaluations`; Mentor hanya dapat menerbitkan sertifikat dari evaluasi miliknya sendiri dan intern satu divisi. Endpoint lama `POST /certificates/generate` tetap tersedia untuk Mentor/Admin Kepegawaian dan menerima `intern_id`.

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
