# Class Diagram Database SIMAGANG

Diagram kelas berikut merangkum tabel domain dari skema database setelah seluruh migrasi proyek diterapkan. Kolom yang ditampilkan adalah identitas, foreign key, dan atribut utama; kolom audit `created_at` dan `updated_at` tidak ditampilkan agar diagram tetap terbaca. Tabel infrastruktur Laravel tidak disertakan.

```mermaid
classDiagram
    class User {
      +bigint id PK
      +string name
      +string email UK
      +string role
      +string status_akun
      +string nip
      +string position
      +string no_hp
      +string profile_photo_path
      +bigint division_id FK
    }
    class Division {
      +bigint id PK
      +string name
      +string code UK
      +text description
      +int quota
    }
    class InternApplication {
      +bigint id PK
      +bigint user_id FK
      +bigint division_id FK
      +bigint mentor_id FK
      +bigint verified_by_kepegawaian FK
      +bigint verified_by_kabid FK
      +bigint verified_by_kadis FK
      +bigint surat_balasan_id FK
      +string application_type
      +string institution_name
      +string tracking_code UK
      +string final_status
      +string internship_status
      +date start_date
      +date end_date
      +string jenjang
    }
    class InternApplicationHistory {
      +bigint id PK
      +bigint intern_application_id FK
      +bigint actor_id FK
      +string actor_role
      +string from_status
      +string to_status
      +string decision
      +timestamp decided_at
    }
    class InternshipPeriod {
      +bigint id PK
      +string name
      +date start_date
      +date end_date
      +int monthly_quota
      +date registration_start_date
      +date registration_end_date
      +boolean is_active
    }
    class Attendance {
      +bigint id PK
      +bigint intern_application_id FK
      +date date
      +datetime clock_in_at
      +datetime clock_out_at
      +string status
      +string verification_status
    }
    class Logbook {
      +bigint id PK
      +bigint intern_application_id FK
      +bigint verified_by FK
      +date date
      +text activity_description
      +string category
      +string verification_status
    }
    class Task {
      +bigint id PK
      +bigint assigned_to FK
      +bigint created_by FK
      +bigint division_id FK
      +string title
      +datetime deadline
      +string status
      +decimal score
      +string submission_file
    }
    class Evaluation {
      +bigint id PK
      +bigint intern_application_id FK
      +bigint mentor_id FK
      +decimal score_discipline
      +decimal score_quality
      +decimal score_initiative
      +decimal score_teamwork
      +decimal score_softskill
      +decimal score_responsibility
      +decimal final_score
      +string grade_letter
    }
    class Certificate {
      +bigint id PK
      +bigint intern_application_id FK
      +string certificate_number UK
      +string qr_hash UK
      +string pdf_path
      +timestamp issued_at
    }
    class Holiday {
      +bigint id PK
      +date date
      +string name
      +text description
    }
    class SuratBalasan {
      +bigint id PK
      +string nomor_surat UK
      +timestamp tanggal_terbit
      +string file_path
    }
    class PenilaianKuliah {
      +bigint id PK
      +bigint intern_application_id FK
      +bigint dinilai_oleh FK
      +string aspek
      +decimal nilai
      +text catatan
    }
    class PenilaianSmk {
      +bigint id PK
      +bigint intern_application_id FK
      +bigint dinilai_oleh FK
      +string aspek
      +decimal nilai
      +text catatan
    }
    class AspekPenilaianSmk {
      +bigint id PK
      +bigint dibuat_oleh FK
      +string nama
      +text deskripsi
      +boolean aktif
    }

    Division "0..1" --> "0..*" User : division_id
    User "1" --> "0..*" InternApplication : user_id pemohon
    Division "0..1" --> "0..*" InternApplication : division_id
    User "0..1" --> "0..*" InternApplication : mentor_id
    User "0..1" --> "0..*" InternApplication : verifikator
    SuratBalasan "0..1" --> "0..*" InternApplication : surat_balasan_id
    InternApplication "1" --> "0..*" InternApplicationHistory : histori
    User "0..1" --> "0..*" InternApplicationHistory : actor_id
    InternApplication "1" --> "0..*" Attendance : presensi
    InternApplication "1" --> "0..*" Logbook : logbook
    User "0..1" --> "0..*" Logbook : verified_by
    User "0..1" --> "0..*" Task : assigned_to
    User "0..1" --> "0..*" Task : created_by
    Division "0..1" --> "0..*" Task : division_id
    InternApplication "1" --> "0..*" Evaluation : evaluasi
    User "1" --> "0..*" Evaluation : mentor_id
    InternApplication "1" --> "0..*" Certificate : sertifikat
    InternApplication "1" --> "0..*" PenilaianKuliah : penilaian
    User "0..1" --> "0..*" PenilaianKuliah : dinilai_oleh
    InternApplication "1" --> "0..*" PenilaianSmk : penilaian
    User "0..1" --> "0..*" PenilaianSmk : dinilai_oleh
    User "0..1" --> "0..*" AspekPenilaianSmk : dibuat_oleh
```

### Catatan

- Kardinalitas mengikuti foreign key dan batasan unik pada migrasi; misalnya `Evaluation` dan `Certificate` terhubung ke `InternApplication` sebagai satu-ke-banyak karena foreign key aplikasi belum diberi constraint unik.
- Referensi `User` ke `InternApplication` dengan label `verifikator` merangkum tiga foreign key terpisah: `verified_by_kepegawaian`, `verified_by_kabid`, dan `verified_by_kadis`.
- `InternshipPeriod` dan `Holiday` merupakan tabel domain tanpa foreign key ke tabel lain pada skema saat ini.
- Kolom atribut lengkap dan detail aturan tersedia di migrasi `database/migrations`.
