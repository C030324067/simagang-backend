# Kamus Data Database SIMAGANG

Struktur tabel berikut disusun berdasarkan file migration proyek hingga 2 November 2026. Tipe data ditulis secara ringkas; `Timestamp` mencakup kolom waktu standar `created_at` dan `updated_at`.

### Tabel 3.1 Tabel Users

| No | Nama Field | Tipedata |
| -- | ---------- | -------- |
| 1 | id | Bigint |
| 2 | name | Varchar |
| 3 | email | Varchar |
| 4 | profile_photo_path | Varchar, nullable |
| 5 | email_verified_at | Timestamp |
| 6 | password | Varchar |
| 7 | role | ENUM |
| 8 | no_hp | Varchar |
| 9 | division_id | Bigint |
| 10 | remember_token | Varchar |
| 11 | created_at | Timestamp |
| 12 | updated_at | Timestamp |
| 13 | status_akun | Varchar |
| 14 | tanggal_disetujui | Timestamp |
| 15 | nip | Varchar |
| 16 | position | Varchar |
| 17 | is_active | Boolean |

### Tabel 3.2 Tabel Divisions

| No | Nama Field | Tipedata |
| -- | ---------- | -------- |
| 1 | id | Bigint |
| 2 | name | Varchar |
| 3 | code | Varchar |
| 4 | description | Text |
| 5 | created_at | Timestamp |
| 6 | updated_at | Timestamp |
| 7 | quota | Integer |

### Tabel 3.3 Tabel Intern Applications

| No | Nama Field | Tipedata |
| -- | ---------- | -------- |
| 1 | id | Bigint |
| 2 | user_id | Bigint |
| 3 | application_type | ENUM |
| 4 | institution_name | Varchar |
| 5 | recommendation_letter_number | Varchar |
| 6 | file_proposal | Varchar |
| 7 | file_recommendation_letter | Varchar |
| 8 | file_cv | Varchar |
| 9 | start_date | Date |
| 10 | end_date | Date |
| 11 | status_kepegawaian | ENUM |
| 12 | notes_kepegawaian | Text |
| 13 | verified_by_kepegawaian | Bigint |
| 14 | status_kabid | ENUM |
| 15 | notes_kabid | Text |
| 16 | verified_by_kabid | Bigint |
| 17 | status_kadis | ENUM |
| 18 | notes_kadis | Text |
| 19 | verified_by_kadis | Bigint |
| 20 | final_status | ENUM |
| 21 | division_id | Bigint |
| 22 | acceptance_letter_number | Varchar |
| 23 | created_at | Timestamp |
| 24 | updated_at | Timestamp |
| 25 | major | Varchar |
| 26 | cover_letter_path | Varchar |
| 27 | transcript_path | Varchar |
| 28 | student_card_path | Varchar |
| 29 | status | Varchar |
| 30 | rejection_note | Text |
| 31 | official_letter_path | Varchar |
| 32 | internship_status | Varchar |
| 33 | tracking_code | Varchar |
| 34 | official_letter_number | Varchar |
| 35 | mentor_id | Bigint |
| 36 | student_number | Varchar |
| 37 | kabid_decided_at | Timestamp |
| 38 | kabid_rejected_at | Timestamp |
| 39 | rejection_stage | Varchar |
| 40 | jenjang | Varchar |
| 41 | surat_balasan_id | Bigint |

### Tabel 3.4 Tabel Attendances

| No | Nama Field | Tipedata |
| -- | ---------- | -------- |
| 1 | id | Bigint |
| 2 | date | Date |
| 3 | photo_in | Varchar |
| 4 | photo_out | Varchar |
| 5 | status | ENUM |
| 6 | notes | Text |
| 7 | created_at | Timestamp |
| 8 | updated_at | Timestamp |
| 9 | clock_in_at | Timestamp |
| 10 | clock_out_at | Timestamp |
| 11 | selfie_path | Varchar |
| 12 | latitude | Decimal |
| 13 | longitude | Decimal |
| 14 | is_within_radius | Boolean |
| 15 | attachment_path | Varchar |
| 16 | approval_status | Varchar |
| 17 | rejection_reason | Text |
| 18 | intern_application_id | Bigint |

### Tabel 3.5 Tabel Logbooks

| No | Nama Field | Tipedata |
| -- | ---------- | -------- |
| 1 | id | Bigint |
| 2 | date | Date |
| 3 | activity_description | Text |
| 4 | attachment | Varchar |
| 5 | verification_status | ENUM |
| 6 | mentor_notes | Text |
| 7 | verified_by | Bigint |
| 8 | created_at | Timestamp |
| 9 | updated_at | Timestamp |
| 10 | category | Varchar |
| 11 | intern_application_id | Bigint |

### Tabel 3.6 Tabel Tasks

| No | Nama Field | Tipedata |
| -- | ---------- | -------- |
| 1 | id | Bigint |
| 2 | title | Varchar |
| 3 | description | Text |
| 4 | assigned_to | Bigint |
| 5 | created_by | Bigint |
| 6 | deadline | Timestamp |
| 7 | status | ENUM |
| 8 | submission_file | Varchar |
| 9 | submission_notes | Text |
| 10 | created_at | Timestamp |
| 11 | updated_at | Timestamp |
| 12 | score | Decimal |
| 13 | mentor_feedback | Text |
| 14 | division_id | Bigint |
| 15 | submission_file_name | Varchar |
| 16 | catatan_revisi | Text |
| 17 | task_file_path | Varchar |
| 18 | task_file_name | Varchar |
| 19 | revision_file_path | Varchar |
| 20 | revision_file_name | Varchar |

### Tabel 3.7 Tabel Evaluations

| No | Nama Field | Tipedata |
| -- | ---------- | -------- |
| 1 | id | Bigint |
| 2 | mentor_id | Bigint |
| 3 | final_score | Decimal |
| 4 | remarks | Text |
| 5 | created_at | Timestamp |
| 6 | updated_at | Timestamp |
| 7 | task_average | Decimal |
| 8 | attendance_percentage | Decimal |
| 9 | score_discipline | Decimal |
| 10 | score_quality | Decimal |
| 11 | score_initiative | Decimal |
| 12 | score_teamwork | Decimal |
| 13 | grade_letter | Varchar |
| 14 | notes | Text |
| 15 | evaluated_at | Timestamp |
| 16 | intern_application_id | Bigint |
| 17 | score_softskill | Decimal |
| 18 | score_responsibility | Decimal |

### Tabel 3.8 Tabel Certificates

| No | Nama Field | Tipedata |
| -- | ---------- | -------- |
| 1 | id | Bigint |
| 2 | certificate_number | Varchar |
| 3 | qr_hash | Varchar |
| 4 | pdf_path | Varchar |
| 5 | issued_at | Timestamp |
| 6 | created_at | Timestamp |
| 7 | updated_at | Timestamp |
| 8 | intern_application_id | Bigint |
