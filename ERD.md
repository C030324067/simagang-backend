# ERD SIMAGANG

ERD ini merangkum skema domain SIMAGANG berdasarkan migrasi database proyek saat ini. Tabel infrastruktur Laravel seperti `migrations`, `sessions`, `cache`, `jobs`, dan `personal_access_tokens` tidak ditampilkan agar fokus pada proses bisnis magang.

```mermaid
erDiagram
    DIVISIONS {
        bigint id PK
        string name
        string code UK
        text description
        int quota
        timestamp created_at
        timestamp updated_at
    }

    USERS {
        bigint id PK
        string name
        string email UK
        string nip UK "nullable"
        string position "nullable"
        timestamp email_verified_at
        string password
        string role "applicant, intern, admin_kepegawaian, kabid, kadis, mentor"
        string status_akun
        timestamp tanggal_disetujui
        string no_hp
        bigint division_id FK
        string remember_token
        timestamp created_at
        timestamp updated_at
    }

    INTERN_APPLICATIONS {
        bigint id PK
        bigint user_id FK
        bigint division_id FK
        bigint mentor_id FK
        bigint verified_by_kepegawaian FK
        bigint verified_by_kabid FK
        bigint verified_by_kadis FK
        string application_type
        string institution_name
        string major
        string recommendation_letter_number
        string tracking_code UK
        string acceptance_letter_number
        string official_letter_number UK
        string file_proposal
        string file_recommendation_letter
        string file_cv
        string cover_letter_path
        string transcript_path
        string student_card_path
        string official_letter_path
        date start_date
        date end_date
        string status_kepegawaian
        text notes_kepegawaian
        string status_kabid
        text notes_kabid
        string status_kadis
        text notes_kadis
        string status
        text rejection_note
        string final_status
        string internship_status
        timestamp created_at
        timestamp updated_at
    }

    ATTENDANCES {
        bigint id PK
        bigint user_id FK
        date date "unik bersama user_id"
        time check_in_time
        time check_out_time
        timestamp clock_in_at
        timestamp clock_out_at
        string photo_in
        string photo_out
        string selfie_path
        decimal latitude
        decimal longitude
        boolean is_within_radius
        string attachment_path
        string status
        text notes
        string approval_status
        text rejection_reason
        timestamp created_at
        timestamp updated_at
    }

    LOGBOOKS {
        bigint id PK
        bigint user_id FK
        bigint verified_by FK
        date date
        text activity_description
        string attachment
        string verification_status
        text mentor_notes
        timestamp created_at
        timestamp updated_at
    }

    TASKS {
        bigint id PK
        bigint assigned_to FK
        bigint created_by FK
        bigint division_id FK
        string title
        text description
        datetime deadline
        string status
        decimal score
        text mentor_feedback
        string submission_file
        string submission_file_name
        text submission_notes
        timestamp created_at
        timestamp updated_at
    }

    EVALUATIONS {
        bigint id PK
        bigint intern_id FK
        bigint mentor_id FK
        decimal discipline_score
        decimal skill_score
        decimal softskill_score
        decimal responsibility_score
        decimal task_average
        decimal attendance_percentage
        decimal final_score
        decimal score_discipline
        decimal score_quality
        decimal score_initiative
        decimal score_teamwork
        string grade_letter
        text remarks
        text notes
        timestamp evaluated_at
        timestamp created_at
        timestamp updated_at
    }

    CERTIFICATES {
        bigint id PK
        bigint intern_id FK
        string certificate_number UK
        string qr_hash UK
        string pdf_path
        timestamp issued_at
        timestamp created_at
        timestamp updated_at
    }

    DIVISIONS ||--o{ USERS : "menaungi"
    USERS ||--o{ INTERN_APPLICATIONS : "mengajukan"
    DIVISIONS o|--o{ INTERN_APPLICATIONS : "dipilih untuk"
    USERS o|--o{ INTERN_APPLICATIONS : "membimbing"
    USERS o|--o{ INTERN_APPLICATIONS : "memverifikasi kepegawaian"
    USERS o|--o{ INTERN_APPLICATIONS : "memverifikasi kabid"
    USERS o|--o{ INTERN_APPLICATIONS : "memverifikasi kadis"
    USERS ||--o{ ATTENDANCES : "mencatat"
    USERS ||--o{ LOGBOOKS : "mengisi"
    USERS o|--o{ LOGBOOKS : "memverifikasi"
    USERS ||--o{ TASKS : "menerima tugas"
    USERS ||--o{ TASKS : "membuat tugas"
    DIVISIONS o|--o{ TASKS : "mengelompokkan"
    USERS ||--o{ EVALUATIONS : "dinilai sebagai peserta"
    USERS ||--o{ EVALUATIONS : "menilai sebagai mentor"
    USERS ||--o{ CERTIFICATES : "menerima"
```

## Metode Agile yang disarankan

ERD dikembangkan dan ditinjau secara bertahap bersama Product Owner/pengguna. Setiap iterasi menghasilkan bagian skema yang dapat divalidasi terhadap alur aplikasi, bukan menunggu seluruh sistem selesai.

| Iterasi | Product backlog / hasil | Kriteria penerimaan |
|---|---|---|
| Sprint 1 — Fondasi akun dan bidang | `USERS`, `DIVISIONS` | Peran pengguna, status akun, bidang, dan kuota sesuai proses registrasi dan pengelolaan bidang. |
| Sprint 2 — Pengajuan dan persetujuan | `INTERN_APPLICATIONS` serta relasi ke pengguna, bidang, mentor, dan verifikator | Alur pelacakan dan persetujuan Kepegawaian, Kabid, serta Kadis dapat ditelusuri dari relasi dan status yang tersimpan. |
| Sprint 3 — Aktivitas magang | `ATTENDANCES`, `LOGBOOKS`, `TASKS` | Peserta dapat mencatat presensi, mengisi logbook, dan menerima/mengumpulkan tugas; mentor dapat meninjau aktivitas. |
| Sprint 4 — Evaluasi dan keluaran | `EVALUATIONS`, `CERTIFICATES` | Evaluasi mengacu pada peserta dan mentor, serta sertifikat terhubung dengan peserta yang menerimanya. |
| Review dan iterasi | Tinjau diagram, istilah, kardinalitas, dan kebutuhan baru bersama pemangku kepentingan | Perubahan disepakati dan diagram diperbarui sebelum perubahan skema database diterapkan. |

### Catatan relasi

- Master `DIVISIONS` disediakan dinamis melalui API. Seeder saat ini memastikan empat kode: `ikp`, `statistik`, `aptika`, dan `tki`; Kabid/mentor ditautkan dengan `division_id`.
- `USERS.nip` bersifat unik dan nullable agar akun non-pegawai serta akun lama tetap kompatibel; `position` menyimpan jabatan pegawai dan nullable.
- Presensi dan logbook saat ini terhubung langsung ke `users`, bukan ke `intern_applications`.
- Verifikator persetujuan dan mentor disimpan sebagai relasi ke `users`.
- `ATTENDANCES` memiliki batasan unik gabungan pada `user_id` dan `date`.
- Notasi `o|` menunjukkan relasi opsional karena foreign key terkait nullable; `||--o{` menunjukkan satu induk dapat memiliki banyak data turunan.
- Diagram ini menggambarkan struktur yang sudah ada pada migrasi, bukan usulan perubahan database.

## ERD Konseptual Proses Bisnis

Diagram konseptual berikut memakai notasi Chen: persegi panjang untuk entitas, oval untuk atribut, berlian untuk hubungan, dan angka `1`/`N` untuk kardinalitas. Buka gambar langsung atau tampilkan Markdown Preview dengan **Ctrl+Shift+V**.

![ERD konseptual SIMAGANG dengan notasi Chen](./erd-konseptual.svg)

### Batasan diagram konseptual

- Satu permohonan dapat melewati beberapa tahap persetujuan; diagram tidak membatasi jumlah pemeriksa atau tahapan pada implementasi tertentu.
- Penempatan hanya terbentuk setelah permohonan diterima dan menghubungkan peserta, bidang, serta pembimbing dalam konteks satu kegiatan magang.
- Presensi, logbook, tugas, evaluasi, dan sertifikat diletakkan di bawah penempatan untuk menunjukkan keterkaitan proses bisnis. Implementasi database saat ini menghubungkan beberapa data aktivitas langsung ke akun pengguna.
