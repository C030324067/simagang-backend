# Kebutuhan Fungsional dan Nonfungsional SIMAGANG

## 1. Tujuan dan ruang lingkup

SIMAGANG adalah aplikasi untuk mengelola pendaftaran dan seleksi magang, kegiatan peserta selama magang, evaluasi, serta penerbitan dan verifikasi sertifikat. Dokumen ini merangkum kebutuhan berdasarkan fitur dan aturan yang tercermin pada aplikasi saat ini. Target nonfungsional yang belum ditentukan oleh implementasi ditandai sebagai target yang diusulkan.

## 2. Aktor sistem

| Aktor | Hak akses dan tanggung jawab utama |
|---|---|
| Pengunjung | Melihat divisi dan status periode pendaftaran, melacak pengajuan dengan kode tracking, serta memverifikasi sertifikat. |
| Pemohon | Mengirim pendaftaran/pengajuan, melengkapi dokumen, dan memantau hasil seleksi. |
| Peserta magang (Intern) | Mengakses pengajuan sendiri, melakukan presensi, mengisi logbook, mengerjakan tugas, dan melihat evaluasi serta sertifikat. |
| Admin Kepegawaian | Menyetujui akun, memeriksa berkas, memproses tahap administrasi pengajuan, menetapkan divisi, mengelola surat penerimaan, serta mengelola logbook dan sertifikat sesuai kewenangan. |
| Kepala Bidang (Kabid) | Meninjau pengajuan pada divisinya, memilih mentor yang sesuai, dan meneruskan atau menolak pengajuan. |
| Kepala Dinas (Kadis) | Memberikan keputusan akhir atau menolak pengajuan dan menjalankan persetujuan akun sesuai kewenangannya. |
| Mentor | Mengelola tugas, meninjau presensi dan logbook, melihat peserta bimbingan, serta mengisi evaluasi dan menerbitkan sertifikat sesuai kewenangannya. |

## 3. Kebutuhan fungsional

| ID | Kebutuhan | Kriteria penerimaan ringkas |
|---|---|---|
| FR-01 | Sistem menyediakan informasi divisi, kuota, dan status periode pendaftaran kepada pengunjung. | Data divisi dan periode berasal dari sistem; status ketersediaan dan kuota ditampilkan. |
| FR-02 | Sistem menerima pendaftaran akun pemohon. | Sistem memvalidasi data, email unik, dan nomor kontak; akun baru berstatus menunggu persetujuan. |
| FR-03 | Sistem menerima pengajuan magang beserta data institusi, jurusan, periode, dan dokumen pendukung. | Sistem memvalidasi kelengkapan, format/ukuran berkas, periode pendaftaran, dan kuota sebelum menyimpan pengajuan. |
| FR-04 | Sistem memberikan kode tracking untuk pengajuan dan menyediakan pelacakan tanpa login. | Pemohon dapat melihat status dan catatan hasil proses menggunakan kode; kode yang tidak dikenal ditolak. |
| FR-05 | Sistem menyediakan login, logout, profil pengguna, perubahan kata sandi, serta permintaan dan penyelesaian reset kata sandi. | Login yang berhasil menghasilkan token; endpoint terlindungi memerlukan token yang valid. |
| FR-06 | Sistem membatasi halaman dan operasi berdasarkan peran pengguna. | Permintaan tanpa autentikasi atau dengan peran yang tidak berwenang ditolak; Kabid dan mentor dibatasi sesuai divisinya. |
| FR-07 | Sistem mendukung alur pemeriksaan pengajuan oleh Kepegawaian, Kabid, dan Kadis. | Setiap tahap dapat meneruskan atau menolak pengajuan; status, pemeriksa, dan catatan keputusan disimpan. |
| FR-08 | Sistem memungkinkan Kepegawaian mengelola penempatan divisi dan surat penerimaan. | Surat memiliki nomor dan berkas PDF; pengajuan yang diterima dapat mengakses surat melalui akun atau tautan tracking yang berlaku. |
| FR-09 | Sistem menyediakan pengelolaan kuota dan periode pendaftaran magang. | Admin Kepegawaian dapat memperbarui periode/kuota; sistem menolak pendaftaran ketika periode tutup atau kuota tidak tersedia. |
| FR-10 | Sistem menyediakan presensi harian bagi peserta magang. | Peserta dapat melihat status hari ini dan mengirim paling banyak satu presensi per hari per aplikasi magang. |
| FR-11 | Sistem memvalidasi bukti presensi hadir. | Presensi hadir memerlukan foto dan koordinat; sistem menghitung jarak terhadap lokasi kantor dan menolak presensi di luar radius yang dikonfigurasi. |
| FR-12 | Sistem menerima presensi sakit atau izin beserta bukti pendukung dan keterangan yang diwajibkan. | Dokumen dan keterangan divalidasi sebelum presensi disimpan. |
| FR-13 | Sistem mencatat waktu check-in dan check-out menggunakan waktu server. | Check-out hanya dapat dicatat setelah check-in dan tidak dapat dikirim dua kali. |
| FR-14 | Sistem menyediakan antrean persetujuan presensi untuk mentor. | Mentor melihat presensi peserta dalam divisinya, dapat melihat bukti, lalu menyetujui atau menolak dengan alasan bila diperlukan. |
| FR-15 | Sistem menghitung ringkasan kehadiran peserta. | Persentase dihitung terhadap hari kerja efektif; hanya presensi yang memenuhi status persetujuan dan status kehadiran yang ditetapkan sistem dihitung. |
| FR-16 | Sistem memungkinkan peserta membuat dan melihat entri logbook. | Entri menyimpan tanggal, deskripsi, kategori/lampiran bila tersedia, dan status verifikasi awal. |
| FR-17 | Sistem memungkinkan mentor atau Kepegawaian memverifikasi logbook. | Pemeriksa berwenang dapat menyetujui atau menolak entri dan menyimpan catatan pemeriksaan. |
| FR-18 | Sistem memungkinkan mentor membuat dan mengelola tugas peserta. | Tugas dapat berisi judul, deskripsi, tenggat, divisi/penerima, dan lampiran. |
| FR-19 | Sistem memungkinkan peserta mengirim progres dan hasil tugas. | Peserta dapat memperbarui status, mengirim catatan/berkas hasil, dan mengirim berkas revisi sesuai validasi sistem. |
| FR-20 | Sistem menyediakan metrik perkembangan peserta untuk evaluasi. | Mentor dapat melihat metrik presensi, tugas, dan logbook yang terkait dengan peserta bimbingannya. |
| FR-21 | Sistem memungkinkan mentor mengisi evaluasi akhir. | Sistem memvalidasi kewenangan mentor, periode magang, dan rentang skor; nilai akhir serta predikat dihitung dan disimpan. |
| FR-22 | Sistem mendukung penerbitan dan akses sertifikat digital. | Sertifikat terkait dengan aplikasi magang; peserta yang berhak dapat melihat atau mengunduh sertifikat. |
| FR-23 | Sistem menyediakan verifikasi sertifikat publik. | Pengunjung dapat memeriksa keabsahan sertifikat menggunakan hash/QR dan melihat ringkasan informasi sertifikat. |
| FR-24 | Sistem memberikan umpan balik atas operasi yang berhasil atau gagal. | Respons memuat status dan pesan yang dapat dipahami; kesalahan validasi menunjukkan data yang perlu diperbaiki. |

## 4. Aturan bisnis utama

1. Pengajuan harus melewati pemeriksaan sesuai kewenangan Kepegawaian, Kabid, dan Kadis sebelum diterima.
2. Kabid dan mentor hanya dapat mengakses data yang berada dalam cakupan divisinya.
3. Kuota divisi dan periode pendaftaran harus diperiksa sebelum pengajuan diterima.
4. Presensi hadir memerlukan bukti foto dan lokasi; presensi sakit/izin memerlukan dokumen yang sesuai.
5. Sistem menggunakan waktu server untuk pencatatan check-in dan check-out.
6. Evaluasi akhir hanya dapat dibuat oleh mentor yang berwenang setelah periode magang berakhir.
7. Sertifikat diterbitkan setelah peserta memenuhi syarat penyelesaian magang dan evaluasi.
8. Endpoint operasional memerlukan autentikasi; endpoint pelacakan, daftar divisi, status periode, dan verifikasi sertifikat tertentu tersedia untuk pengunjung.

## 5. Kebutuhan nonfungsional

Target bernomor di tabel ini merupakan kriteria yang diusulkan untuk pengembangan dan pengujian; angka tersebut bukan klaim hasil pengukuran aplikasi saat ini.

| ID | Aspek | Kebutuhan / target |
|---|---|---|
| NFR-01 | Keamanan autentikasi | Token autentikasi dikirim melalui HTTPS pada lingkungan produksi, disimpan dengan cara yang sesuai pada klien, dan dapat dicabut saat logout. Password tidak pernah dikirim atau disimpan dalam bentuk teks biasa. |
| NFR-02 | Otorisasi & keamanan | Pemeriksaan peran, kepemilikan data, dan cakupan divisi dilakukan di backend untuk setiap operasi terlindungi. Akun Intern hanya dapat mengakses sistem sampai H+7 setelah `end_date` aplikasi magang yang diterima; setelah batas tersebut akun berstatus `expired`, dinonaktifkan, seluruh token Sanctum dicabut, dan API mengembalikan HTTP 403 berkode `ACCOUNT_EXPIRED`. |
| NFR-03 | Perlindungan data | Dokumen pribadi dan bukti presensi hanya dapat diakses pengguna berwenang; data yang diberikan ke endpoint publik dibatasi pada informasi yang diperlukan. |
| NFR-04 | Validasi dan integritas | Input, tipe/ukuran berkas, status proses, foreign key, kuota, dan batas presensi divalidasi sebelum perubahan disimpan. Operasi multi-langkah yang saling bergantung menggunakan transaksi bila sesuai. |
| NFR-05 | Ketersediaan | Target awal yang diusulkan adalah ketersediaan layanan minimal 99% per bulan, di luar pemeliharaan terjadwal. |
| NFR-06 | Kinerja | Target awal yang diusulkan: 95% permintaan API baca umum selesai dalam ≤2 detik dan operasi laporan/pencarian kompleks dalam ≤5 detik pada beban operasional yang disepakati. |
| NFR-07 | Kapasitas | Daftar data yang dapat bertambah besar mendukung pagination dan filter; unggahan dibatasi ukuran serta jenisnya agar beban server terkendali. |
| NFR-08 | Kompatibilitas | Antarmuka mendukung browser modern pada desktop dan perangkat bergerak. Skema database dan query harus mengikuti driver yang secara resmi dipilih untuk setiap lingkungan deployment. |
| NFR-09 | Kemudahan penggunaan | Formulir memberi label, validasi, status proses, dan pesan kesalahan yang jelas dalam Bahasa Indonesia; fungsi utama dapat digunakan pada layar sempit. |
| NFR-10 | Aksesibilitas | Kontrol utama dapat digunakan melalui keyboard, memiliki nama/label yang jelas, dan mempertahankan kontras teks yang memadai. |
| NFR-11 | Keandalan dan pemulihan | Kegagalan jaringan/server tidak boleh dianggap sebagai logout tanpa respons autentikasi yang menunjukkan token tidak valid. Backup database dan berkas memiliki prosedur pemulihan yang terdokumentasi. |
| NFR-12 | Observabilitas | Kegagalan penting, perubahan status pengajuan, dan operasi administratif dicatat secukupnya untuk penelusuran; password, token, dan isi dokumen sensitif tidak dicatat ke log. |
| NFR-13 | Kemudahan pemeliharaan | API, aturan akses, proses bisnis, migrasi, dan dokumentasi mengikuti struktur proyek; perubahan skema disertai migrasi yang dapat ditinjau dan kompatibel dengan database deployment. |
| NFR-14 | Konsistensi waktu | Waktu presensi berasal dari server; tanggal dan zona waktu ditampilkan konsisten sesuai zona waktu operasional yang ditetapkan deployment. |

## 6. Batasan dan asumsi

- Sistem terdiri dari backend Laravel API dan antarmuka React yang dibundel melalui Vite.
- Autentikasi API menggunakan token Bearer Sanctum. Pengaturan cookie/session hanya diperlukan bila deployment memilih autentikasi SPA berbasis cookie.
- Fitur yang memerlukan layanan eksternal—seperti pengiriman email atau kalender hari kerja—bergantung pada konfigurasi layanan tersebut.
- Target angka performa dan ketersediaan perlu disepakati kembali setelah beban pengguna, infrastruktur, dan lingkungan produksi ditentukan.

## 7. Acuan proyek

- [Use case SIMAGANG](./USE_CASE.md)
- [ERD SIMAGANG](./ERD.md)
- [Dokumentasi API](./API.md)


## Aturan akses pasca-magang

Masa akses akun Intern berakhir setelah melewati tanggal `end_date + 7 hari` pada aplikasi magang yang diterima. Middleware memeriksa batas ini pada setiap request API terautentikasi. Command terjadwal berjalan pukul 00.00 WITA untuk menonaktifkan akun dan mencabut token lebih dini; pemeriksaan middleware tetap menjadi kontrol utama bila scheduler belum berjalan.
