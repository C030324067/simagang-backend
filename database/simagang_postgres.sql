-- ====================================================================
-- SKEMA DATABASE POSTGRESQL: SI-MAGANG (DISIKOMINFO)
-- Generate Time: 2026-09-22 08:06:58
-- Compatible with PostgreSQL 13, 14, 15, 16, 17+
-- ====================================================================

-- 1. TABEL MIGRATIONS (Agar Laravel mengenali migrasi sudah berjalan)
CREATE TABLE IF NOT EXISTS "migrations" (
    "id" serial PRIMARY KEY,
    "migration" varchar(255) NOT NULL,
    "batch" integer NOT NULL
);

-- 2. STRUKTUR TABEL & RELASI

create table "divisions" ("id" bigserial not null primary key, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
alter table "divisions" add constraint "divisions_code_unique" unique ("code");
create table "users" ("id" bigserial not null primary key, "name" varchar(255) not null, "email" varchar(255) not null, "email_verified_at" timestamp(0) without time zone null, "password" varchar(255) not null, "role" varchar(255) check ("role" in ('intern', 'admin_kepegawaian', 'kabid', 'kadis', 'mentor')) not null default 'intern', "no_hp" varchar(255) null, "division_id" bigint null, "remember_token" varchar(100) null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
alter table "users" add constraint "users_division_id_foreign" foreign key ("division_id") references "divisions" ("id") on delete set null;
alter table "users" add constraint "users_email_unique" unique ("email");
create table "password_reset_tokens" ("email" varchar(255) not null, "token" varchar(255) not null, "created_at" timestamp(0) without time zone null);
alter table "password_reset_tokens" add primary key ("email");
create table "sessions" ("id" varchar(255) not null, "user_id" bigint null, "ip_address" varchar(45) null, "user_agent" text null, "payload" text not null, "last_activity" integer not null);
alter table "sessions" add primary key ("id");
create index "sessions_user_id_index" on "sessions" ("user_id");
create index "sessions_last_activity_index" on "sessions" ("last_activity");
create table "cache" ("key" varchar(255) not null, "value" text not null, "expiration" bigint not null);
alter table "cache" add primary key ("key");
create index "cache_expiration_index" on "cache" ("expiration");
create table "cache_locks" ("key" varchar(255) not null, "owner" varchar(255) not null, "expiration" bigint not null);
alter table "cache_locks" add primary key ("key");
create index "cache_locks_expiration_index" on "cache_locks" ("expiration");
create table "jobs" ("id" bigserial not null primary key, "queue" varchar(255) not null, "payload" text not null, "attempts" smallint not null, "reserved_at" integer null, "available_at" integer not null, "created_at" integer not null);
create index "jobs_queue_index" on "jobs" ("queue");
create table "job_batches" ("id" varchar(255) not null, "name" varchar(255) not null, "total_jobs" integer not null, "pending_jobs" integer not null, "failed_jobs" integer not null, "failed_job_ids" text not null, "options" text null, "cancelled_at" integer null, "created_at" integer not null, "finished_at" integer null);
alter table "job_batches" add primary key ("id");
create table "failed_jobs" ("id" bigserial not null primary key, "uuid" varchar(255) not null, "connection" varchar(255) not null, "queue" varchar(255) not null, "payload" text not null, "exception" text not null, "failed_at" timestamp(0) without time zone not null default CURRENT_TIMESTAMP);
create index "failed_jobs_connection_queue_failed_at_index" on "failed_jobs" ("connection", "queue", "failed_at");
alter table "failed_jobs" add constraint "failed_jobs_uuid_unique" unique ("uuid");
create table "personal_access_tokens" ("id" bigserial not null primary key, "tokenable_type" varchar(255) not null, "tokenable_id" bigint not null, "name" text not null, "token" varchar(64) not null, "abilities" text null, "last_used_at" timestamp(0) without time zone null, "expires_at" timestamp(0) without time zone null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
create index "personal_access_tokens_tokenable_type_tokenable_id_index" on "personal_access_tokens" ("tokenable_type", "tokenable_id");
alter table "personal_access_tokens" add constraint "personal_access_tokens_token_unique" unique ("token");
create index "personal_access_tokens_expires_at_index" on "personal_access_tokens" ("expires_at");
create table "intern_applications" ("id" bigserial not null primary key, "user_id" bigint not null, "application_type" varchar(255) check ("application_type" in ('mandiri', 'rekomendasi_kampus')) not null, "institution_name" varchar(255) not null, "recommendation_letter_number" varchar(255) null, "file_proposal" varchar(255) null, "file_recommendation_letter" varchar(255) null, "file_cv" varchar(255) null, "start_date" date not null, "end_date" date not null, "status_kepegawaian" varchar(255) check ("status_kepegawaian" in ('pending', 'approved', 'rejected')) not null default 'pending', "notes_kepegawaian" text null, "verified_by_kepegawaian" bigint null, "status_kabid" varchar(255) check ("status_kabid" in ('pending', 'approved', 'rejected')) not null default 'pending', "notes_kabid" text null, "verified_by_kabid" bigint null, "status_kadis" varchar(255) check ("status_kadis" in ('pending', 'approved', 'rejected')) not null default 'pending', "notes_kadis" text null, "verified_by_kadis" bigint null, "final_status" varchar(255) check ("final_status" in ('in_review', 'accepted', 'rejected')) not null default 'in_review', "division_id" bigint null, "acceptance_letter_number" varchar(255) null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
alter table "intern_applications" add constraint "intern_applications_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;
alter table "intern_applications" add constraint "intern_applications_verified_by_kepegawaian_foreign" foreign key ("verified_by_kepegawaian") references "users" ("id") on delete set null;
alter table "intern_applications" add constraint "intern_applications_verified_by_kabid_foreign" foreign key ("verified_by_kabid") references "users" ("id") on delete set null;
alter table "intern_applications" add constraint "intern_applications_verified_by_kadis_foreign" foreign key ("verified_by_kadis") references "users" ("id") on delete set null;
alter table "intern_applications" add constraint "intern_applications_division_id_foreign" foreign key ("division_id") references "divisions" ("id") on delete set null;
create table "attendances" ("id" bigserial not null primary key, "user_id" bigint not null, "date" date not null, "check_in_time" time(0) without time zone null, "check_out_time" time(0) without time zone null, "photo_in" varchar(255) null, "photo_out" varchar(255) null, "status" varchar(255) check ("status" in ('present', 'late', 'sick', 'leave')) not null default 'present', "notes" text null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
alter table "attendances" add constraint "attendances_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;
alter table "attendances" add constraint "attendances_user_id_date_unique" unique ("user_id", "date");
create table "logbooks" ("id" bigserial not null primary key, "user_id" bigint not null, "date" date not null, "activity_description" text not null, "attachment" varchar(255) null, "verification_status" varchar(255) check ("verification_status" in ('pending', 'approved', 'rejected')) not null default 'pending', "mentor_notes" text null, "verified_by" bigint null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
alter table "logbooks" add constraint "logbooks_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;
alter table "logbooks" add constraint "logbooks_verified_by_foreign" foreign key ("verified_by") references "users" ("id") on delete set null;
create table "tasks" ("id" bigserial not null primary key, "title" varchar(255) not null, "description" text null, "assigned_to" bigint not null, "created_by" bigint not null, "deadline" timestamp(0) without time zone null, "status" varchar(255) check ("status" in ('todo', 'in_progress', 'completed')) not null default 'todo', "submission_file" varchar(255) null, "submission_notes" text null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
alter table "tasks" add constraint "tasks_assigned_to_foreign" foreign key ("assigned_to") references "users" ("id") on delete cascade;
alter table "tasks" add constraint "tasks_created_by_foreign" foreign key ("created_by") references "users" ("id") on delete cascade;
create table "evaluations" ("id" bigserial not null primary key, "intern_id" bigint not null, "mentor_id" bigint not null, "discipline_score" decimal(5, 2) not null, "skill_score" decimal(5, 2) not null, "softskill_score" decimal(5, 2) not null, "final_score" decimal(5, 2) not null, "remarks" text null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
alter table "evaluations" add constraint "evaluations_intern_id_foreign" foreign key ("intern_id") references "users" ("id") on delete cascade;
alter table "evaluations" add constraint "evaluations_mentor_id_foreign" foreign key ("mentor_id") references "users" ("id") on delete cascade;
create table "certificates" ("id" bigserial not null primary key, "intern_id" bigint not null, "certificate_number" varchar(255) not null, "qr_hash" varchar(255) not null, "pdf_path" varchar(255) null, "issued_at" timestamp(0) without time zone null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null);
alter table "certificates" add constraint "certificates_intern_id_foreign" foreign key ("intern_id") references "users" ("id") on delete cascade;
alter table "certificates" add constraint "certificates_certificate_number_unique" unique ("certificate_number");
alter table "certificates" add constraint "certificates_qr_hash_unique" unique ("qr_hash");

-- ====================================================================
-- 3. INSERT RECORD MIGRATION KE TABEL 'migrations'
-- ====================================================================
INSERT INTO "migrations" ("migration", "batch") VALUES ('0000_12_31_235959_create_divisions_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('0001_01_01_000000_create_users_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('0001_01_01_000001_create_cache_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('0001_01_01_000002_create_jobs_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('2026_09_22_033651_create_personal_access_tokens_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('2026_09_22_034000_create_intern_applications_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('2026_09_22_034001_create_attendances_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('2026_09_22_034002_create_logbooks_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('2026_09_22_034003_create_tasks_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('2026_09_22_034004_create_evaluations_table', 1);
INSERT INTO "migrations" ("migration", "batch") VALUES ('2026_09_22_034005_create_certificates_table', 1);

-- ====================================================================
-- 4. DATA AWAL (SEEDER / DUMMY ACCOUNTS & DEMO DATA)
-- Password semua akun: password123
-- ====================================================================

-- Data Tabel: divisions
INSERT INTO "divisions" ("id", "name", "code", "description", "created_at", "updated_at") VALUES ('1', 'Bidang Aplikasi Informatika', 'APTIKA', 'Pengembangan aplikasi, integrasi sistem, dan tata kelola e-government', '2026-09-22 08:07:20', '2026-09-22 08:07:20');
INSERT INTO "divisions" ("id", "name", "code", "description", "created_at", "updated_at") VALUES ('2', 'Bidang Informasi dan Komunikasi Publik', 'IKP', 'Pengelolaan opini publik, kemitraan media, dan diseminasi informasi daerah', '2026-09-22 08:07:20', '2026-09-22 08:07:20');
INSERT INTO "divisions" ("id", "name", "code", "description", "created_at", "updated_at") VALUES ('3', 'Bidang Statistik dan Persandian', 'STATISTIK', 'Satu data daerah, metadata statistik sektoral, dan keamanan informasi persandian', '2026-09-22 08:07:20', '2026-09-22 08:07:20');
INSERT INTO "divisions" ("id", "name", "code", "description", "created_at", "updated_at") VALUES ('4', 'Sekretariat Diskominfo', 'SEKRETARIAT', 'Urusan kepegawaian, tata laksana kerja, dan administrasi umum dinas', '2026-09-22 08:07:20', '2026-09-22 08:07:20');

-- Data Tabel: users
INSERT INTO "users" ("id", "name", "email", "email_verified_at", "password", "role", "no_hp", "division_id", "remember_token", "created_at", "updated_at") VALUES ('1', 'Ahmad Fauzi (Pemohon Magang)', 'intern@diskominfo.go.id', NULL, '$2y$12$tTDmvtCCbDl3uQeDs0u4RuNMauqZwwnWYFacmYi2rYuJEoc45E6Dy', 'intern', '081234567890', '1', NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "users" ("id", "name", "email", "email_verified_at", "password", "role", "no_hp", "division_id", "remember_token", "created_at", "updated_at") VALUES ('2', 'Siti Rahmawati, S.AP (Admin Kepegawaian)', 'kepegawaian@diskominfo.go.id', NULL, '$2y$12$tTDmvtCCbDl3uQeDs0u4RuNMauqZwwnWYFacmYi2rYuJEoc45E6Dy', 'admin_kepegawaian', '081234567891', '4', NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "users" ("id", "name", "email", "email_verified_at", "password", "role", "no_hp", "division_id", "remember_token", "created_at", "updated_at") VALUES ('3', 'Bambang Sudarsono, S.T., M.Kom (Kabid Aptika)', 'kabid@diskominfo.go.id', NULL, '$2y$12$tTDmvtCCbDl3uQeDs0u4RuNMauqZwwnWYFacmYi2rYuJEoc45E6Dy', 'kabid', '081234567892', '1', NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "users" ("id", "name", "email", "email_verified_at", "password", "role", "no_hp", "division_id", "remember_token", "created_at", "updated_at") VALUES ('4', 'Dr. Ir. H. Hendra Wijaya, M.Si (Kepala Dinas Kominfo)', 'kadis@diskominfo.go.id', NULL, '$2y$12$tTDmvtCCbDl3uQeDs0u4RuNMauqZwwnWYFacmYi2rYuJEoc45E6Dy', 'kadis', '081234567893', NULL, NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "users" ("id", "name", "email", "email_verified_at", "password", "role", "no_hp", "division_id", "remember_token", "created_at", "updated_at") VALUES ('5', 'Rian Pratama, S.Kom (Pembimbing Lapangan Aptika)', 'mentor@diskominfo.go.id', NULL, '$2y$12$tTDmvtCCbDl3uQeDs0u4RuNMauqZwwnWYFacmYi2rYuJEoc45E6Dy', 'mentor', '081234567894', '1', NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "users" ("id", "name", "email", "email_verified_at", "password", "role", "no_hp", "division_id", "remember_token", "created_at", "updated_at") VALUES ('6', 'Dewi Lestari (Mahasiswa Kampus)', 'dewi@kampus.ac.id', NULL, '$2y$12$tTDmvtCCbDl3uQeDs0u4RuNMauqZwwnWYFacmYi2rYuJEoc45E6Dy', 'intern', '081298765432', NULL, NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "users" ("id", "name", "email", "email_verified_at", "password", "role", "no_hp", "division_id", "remember_token", "created_at", "updated_at") VALUES ('7', 'Budi Santoso (Siswa SMK)', 'budi@smk.sch.id', NULL, '$2y$12$tTDmvtCCbDl3uQeDs0u4RuNMauqZwwnWYFacmYi2rYuJEoc45E6Dy', 'intern', '081255554444', '2', NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');

-- Data Tabel: intern_applications
INSERT INTO "intern_applications" ("id", "user_id", "application_type", "institution_name", "recommendation_letter_number", "file_proposal", "file_recommendation_letter", "file_cv", "start_date", "end_date", "status_kepegawaian", "notes_kepegawaian", "verified_by_kepegawaian", "status_kabid", "notes_kabid", "verified_by_kabid", "status_kadis", "notes_kadis", "verified_by_kadis", "final_status", "division_id", "acceptance_letter_number", "created_at", "updated_at") VALUES ('1', '1', 'rekomendasi_kampus', 'Universitas Indonesia', '421.4/UNIV/III/2026', 'applications/demo_proposal.pdf', 'applications/demo_rekomendasi.pdf', NULL, '2026-08-23', '2026-11-21', 'approved', 'Berkas administrasi dan surat rekomendasi kampus terverifikasi lengkap.', '2', 'approved', 'Kandidat memiliki latar belakang IT yang sesuai dengan proyek e-Government di Bidang APTIKA.', '3', 'approved', 'Disetujui. Surat penerimaan magang resmi diterbitkan.', '4', 'accepted', '1', '500.12.1/DISKOMINFO/2026/0001', '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "intern_applications" ("id", "user_id", "application_type", "institution_name", "recommendation_letter_number", "file_proposal", "file_recommendation_letter", "file_cv", "start_date", "end_date", "status_kepegawaian", "notes_kepegawaian", "verified_by_kepegawaian", "status_kabid", "notes_kabid", "verified_by_kabid", "status_kadis", "notes_kadis", "verified_by_kadis", "final_status", "division_id", "acceptance_letter_number", "created_at", "updated_at") VALUES ('2', '6', 'mandiri', 'Institut Teknologi Bandung', NULL, 'applications/demo_proposal.pdf', NULL, 'applications/demo_cv.pdf', '2026-09-29', '2026-12-28', 'pending', NULL, NULL, 'pending', NULL, NULL, 'pending', NULL, NULL, 'in_review', NULL, NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "intern_applications" ("id", "user_id", "application_type", "institution_name", "recommendation_letter_number", "file_proposal", "file_recommendation_letter", "file_cv", "start_date", "end_date", "status_kepegawaian", "notes_kepegawaian", "verified_by_kepegawaian", "status_kabid", "notes_kabid", "verified_by_kabid", "status_kadis", "notes_kadis", "verified_by_kadis", "final_status", "division_id", "acceptance_letter_number", "created_at", "updated_at") VALUES ('3', '7', 'rekomendasi_kampus', 'SMK Negeri 1 Bidang Multimedia', '800/SMK1/2026/089', 'applications/demo_proposal.pdf', 'applications/demo_rekomendasi.pdf', NULL, '2026-09-27', '2026-12-26', 'approved', 'Surat pengantar sekolah dan persetujuan wali telah diverifikasi.', '2', 'pending', NULL, NULL, 'pending', NULL, NULL, 'in_review', '1', NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');

-- Data Tabel: attendances
INSERT INTO "attendances" ("id", "user_id", "date", "check_in_time", "check_out_time", "photo_in", "photo_out", "status", "notes", "created_at", "updated_at") VALUES ('1', '1', '2026-09-22', '07:48:12', '16:35:40', NULL, NULL, 'present', 'Tugas penataan database portal diskominfo', '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "attendances" ("id", "user_id", "date", "check_in_time", "check_out_time", "photo_in", "photo_out", "status", "notes", "created_at", "updated_at") VALUES ('2', '1', '2026-09-21', '07:55:00', '16:30:10', NULL, NULL, 'present', 'Hadir tepat waktu di ruang Aptika', '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "attendances" ("id", "user_id", "date", "check_in_time", "check_out_time", "photo_in", "photo_out", "status", "notes", "created_at", "updated_at") VALUES ('3', '1', '2026-09-20', '08:22:15', '16:45:00', NULL, NULL, 'late', 'Terlambat karena kendala transportasi hujan lebat', '2026-09-22 08:07:21', '2026-09-22 08:07:21');

-- Data Tabel: logbooks
INSERT INTO "logbooks" ("id", "user_id", "date", "activity_description", "attachment", "verification_status", "mentor_notes", "verified_by", "created_at", "updated_at") VALUES ('1', '1', '2026-09-22', 'Melakukan refactoring endpoint API otentikasi Sanctum dan merancang skema database SI-MAGANG bersama tim programmer Aptika.', NULL, 'approved', 'Pekerjaan sangat baik dan sesuai standar PSR-12.', '5', '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "logbooks" ("id", "user_id", "date", "activity_description", "attachment", "verification_status", "mentor_notes", "verified_by", "created_at", "updated_at") VALUES ('2', '1', '2026-09-21', 'Membantu instalasi server uji coba dan konfigurasi reverse proxy Nginx untuk aplikasi internal Diskominfo.', NULL, 'approved', 'Bagus, terus pelajari arsitektur microservices.', '5', '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "logbooks" ("id", "user_id", "date", "activity_description", "attachment", "verification_status", "mentor_notes", "verified_by", "created_at", "updated_at") VALUES ('3', '1', '2026-09-20', 'Mempelajari modul keamanan data persandian dan membuat dokumentasi teknis sistem integrasi Satu Data.', NULL, 'pending', NULL, NULL, '2026-09-22 08:07:21', '2026-09-22 08:07:21');

-- Data Tabel: tasks
INSERT INTO "tasks" ("id", "title", "description", "assigned_to", "created_by", "deadline", "status", "submission_file", "submission_notes", "created_at", "updated_at") VALUES ('1', 'Pembuatan Dokumentasi REST API SI-MAGANG', 'Susun dokumentasi endpoint otentikasi, alur persetujuan 3 tingkat, dan manajemen sertifikat berformat OpenAPI/Swagger.', '1', '5', '2026-09-25 08:07:21', 'in_progress', NULL, 'Draft spesifikasi endpoint 80% selesai disusun.', '2026-09-22 08:07:21', '2026-09-22 08:07:21');
INSERT INTO "tasks" ("id", "title", "description", "assigned_to", "created_by", "deadline", "status", "submission_file", "submission_notes", "created_at", "updated_at") VALUES ('2', 'Uji Penetrasi dan Validasi Input Upload Berkas', 'Pastikan filter MIME type PDF dan batas ukuran berkas maksimum 10MB terlindungi dari kerentanan upload.', '1', '5', '2026-09-21 08:07:21', 'completed', NULL, 'Pengujian selesai dengan menggunakan form validation Laravel.', '2026-09-22 08:07:21', '2026-09-22 08:07:21');

-- Data Tabel: evaluations
INSERT INTO "evaluations" ("id", "intern_id", "mentor_id", "discipline_score", "skill_score", "softskill_score", "final_score", "remarks", "created_at", "updated_at") VALUES ('1', '1', '5', '92.5', '95', '90', '92.75', 'Peserta magang menunjukkan inisiatif tinggi, kemampuan teknis rekayasa perangkat lunak yang matang, serta kedisiplinan kerja yang teladan.', '2026-09-22 08:07:21', '2026-09-22 08:07:21');

-- Data Tabel: certificates
INSERT INTO "certificates" ("id", "intern_id", "certificate_number", "qr_hash", "pdf_path", "issued_at", "created_at", "updated_at") VALUES ('1', '1', 'CERT/DISKOMINFO/2026/0001', 'd85e7a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', NULL, '2026-09-20 08:07:21', '2026-09-22 08:07:21', '2026-09-22 08:07:21');

-- Reset Sequences agar auto-increment ID berlanjut dengan benar
SELECT setval(pg_get_serial_sequence('"divisions"', 'id'), COALESCE(MAX("id"), 1)) FROM "divisions";
SELECT setval(pg_get_serial_sequence('"users"', 'id'), COALESCE(MAX("id"), 1)) FROM "users";
SELECT setval(pg_get_serial_sequence('"intern_applications"', 'id'), COALESCE(MAX("id"), 1)) FROM "intern_applications";
SELECT setval(pg_get_serial_sequence('"attendances"', 'id'), COALESCE(MAX("id"), 1)) FROM "attendances";
SELECT setval(pg_get_serial_sequence('"logbooks"', 'id'), COALESCE(MAX("id"), 1)) FROM "logbooks";
SELECT setval(pg_get_serial_sequence('"tasks"', 'id'), COALESCE(MAX("id"), 1)) FROM "tasks";
SELECT setval(pg_get_serial_sequence('"evaluations"', 'id'), COALESCE(MAX("id"), 1)) FROM "evaluations";
SELECT setval(pg_get_serial_sequence('"certificates"', 'id'), COALESCE(MAX("id"), 1)) FROM "certificates";
