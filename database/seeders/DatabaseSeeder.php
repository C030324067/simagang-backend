<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Certificate;
use App\Models\Division;
use App\Models\Evaluation;
use App\Models\InternApplication;
use App\Models\Logbook;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Divisions
        $aptika = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
            'description' => 'Pengembangan aplikasi, integrasi sistem, dan tata kelola e-government',
        ]);

        $ikp = Division::create([
            'name' => 'Bidang Informasi dan Komunikasi Publik',
            'code' => 'IKP',
            'description' => 'Pengelolaan opini publik, kemitraan media, dan diseminasi informasi daerah',
        ]);

        $statistik = Division::create([
            'name' => 'Bidang Statistik dan Persandian',
            'code' => 'STATISTIK',
            'description' => 'Satu data daerah, metadata statistik sektoral, dan keamanan informasi persandian',
        ]);

        $sekretariat = Division::create([
            'name' => 'Sekretariat Diskominfo',
            'code' => 'SEKRETARIAT',
            'description' => 'Urusan kepegawaian, tata laksana kerja, dan administrasi umum dinas',
        ]);

        $defaultPassword = Hash::make('password123');

        // 2. Seed 5 Default Required Accounts
        $intern = User::create([
            'name' => 'Ahmad Fauzi (Pemohon Magang)',
            'email' => 'intern@diskominfo.go.id',
            'password' => $defaultPassword,
            'role' => 'intern',
            'no_hp' => '081234567890',
            'division_id' => $aptika->id,
        ]);

        $kepegawaian = User::create([
            'name' => 'Siti Rahmawati, S.AP (Admin Kepegawaian)',
            'email' => 'kepegawaian@diskominfo.go.id',
            'password' => $defaultPassword,
            'role' => 'admin_kepegawaian',
            'no_hp' => '081234567891',
            'division_id' => $sekretariat->id,
        ]);

        $kabid = User::create([
            'name' => 'Bambang Sudarsono, S.T., M.Kom (Kabid Aptika)',
            'email' => 'kabid@diskominfo.go.id',
            'password' => $defaultPassword,
            'role' => 'kabid',
            'no_hp' => '081234567892',
            'division_id' => $aptika->id,
        ]);

        $kadis = User::create([
            'name' => 'Dr. Ir. H. Hendra Wijaya, M.Si (Kepala Dinas Kominfo)',
            'email' => 'kadis@diskominfo.go.id',
            'password' => $defaultPassword,
            'role' => 'kadis',
            'no_hp' => '081234567893',
        ]);

        $mentor = User::create([
            'name' => 'Rian Pratama, S.Kom (Pembimbing Lapangan Aptika)',
            'email' => 'mentor@diskominfo.go.id',
            'password' => $defaultPassword,
            'role' => 'mentor',
            'no_hp' => '081234567894',
            'division_id' => $aptika->id,
        ]);

        // Additional demo interns for queue testing
        $internKampus = User::create([
            'name' => 'Dewi Lestari (Mahasiswa Kampus)',
            'email' => 'dewi@kampus.ac.id',
            'password' => $defaultPassword,
            'role' => 'intern',
            'no_hp' => '081298765432',
        ]);

        $internSmk = User::create([
            'name' => 'Budi Santoso (Siswa SMK)',
            'email' => 'budi@smk.sch.id',
            'password' => $defaultPassword,
            'role' => 'intern',
            'no_hp' => '081255554444',
            'division_id' => $ikp->id,
        ]);

        // 3. Seed Applications in Various Approval States
        // Application 1: Intern 1 (Accepted with Letter)
        $app1 = InternApplication::create([
            'user_id' => $intern->id,
            'application_type' => 'rekomendasi_kampus',
            'institution_name' => 'Universitas Indonesia',
            'recommendation_letter_number' => '421.4/UNIV/III/2026',
            'file_proposal' => 'applications/demo_proposal.pdf',
            'file_recommendation_letter' => 'applications/demo_rekomendasi.pdf',
            'start_date' => Carbon::now()->subDays(30)->toDateString(),
            'end_date' => Carbon::now()->addDays(60)->toDateString(),
            'status_kepegawaian' => 'approved',
            'notes_kepegawaian' => 'Berkas administrasi dan surat rekomendasi kampus terverifikasi lengkap.',
            'verified_by_kepegawaian' => $kepegawaian->id,
            'status_kabid' => 'approved',
            'notes_kabid' => 'Kandidat memiliki latar belakang IT yang sesuai dengan proyek e-Government di Bidang APTIKA.',
            'verified_by_kabid' => $kabid->id,
            'status_kadis' => 'approved',
            'notes_kadis' => 'Disetujui. Surat penerimaan magang resmi diterbitkan.',
            'verified_by_kadis' => $kadis->id,
            'final_status' => 'accepted',
            'division_id' => $aptika->id,
            'acceptance_letter_number' => '500.12.1/DISKOMINFO/2026/0001',
        ]);

        // Application 2: Intern Dewi (Pending Kepegawaian - test Level 1 queue)
        InternApplication::create([
            'user_id' => $internKampus->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Institut Teknologi Bandung',
            'file_proposal' => 'applications/demo_proposal.pdf',
            'file_cv' => 'applications/demo_cv.pdf',
            'start_date' => Carbon::now()->addDays(7)->toDateString(),
            'end_date' => Carbon::now()->addDays(97)->toDateString(),
            'status_kepegawaian' => 'pending',
            'status_kabid' => 'pending',
            'status_kadis' => 'pending',
            'final_status' => 'in_review',
        ]);

        // Application 3: Intern Budi (Approved Kepegawaian -> Pending Kabid Aptika - test Level 2 queue)
        InternApplication::create([
            'user_id' => $internSmk->id,
            'application_type' => 'rekomendasi_kampus',
            'institution_name' => 'SMK Negeri 1 Bidang Multimedia',
            'recommendation_letter_number' => '800/SMK1/2026/089',
            'file_proposal' => 'applications/demo_proposal.pdf',
            'file_recommendation_letter' => 'applications/demo_rekomendasi.pdf',
            'start_date' => Carbon::now()->addDays(5)->toDateString(),
            'end_date' => Carbon::now()->addDays(95)->toDateString(),
            'status_kepegawaian' => 'approved',
            'notes_kepegawaian' => 'Surat pengantar sekolah dan persetujuan wali telah diverifikasi.',
            'verified_by_kepegawaian' => $kepegawaian->id,
            'status_kabid' => 'pending',
            'status_kadis' => 'pending',
            'final_status' => 'in_review',
            'division_id' => $aptika->id,
        ]);

        // 4. Seed Attendances for Intern 1
        $today = Carbon::today();
        Attendance::create([
            'user_id' => $intern->id,
            'date' => $today->toDateString(),
            'check_in_time' => '07:48:12',
            'check_out_time' => '16:35:40',
            'status' => 'present',
            'notes' => 'Tugas penataan database portal diskominfo',
        ]);

        Attendance::create([
            'user_id' => $intern->id,
            'date' => $today->copy()->subDays(1)->toDateString(),
            'check_in_time' => '07:55:00',
            'check_out_time' => '16:30:10',
            'status' => 'present',
            'notes' => 'Hadir tepat waktu di ruang Aptika',
        ]);

        Attendance::create([
            'user_id' => $intern->id,
            'date' => $today->copy()->subDays(2)->toDateString(),
            'check_in_time' => '08:22:15',
            'check_out_time' => '16:45:00',
            'status' => 'late',
            'notes' => 'Terlambat karena kendala transportasi hujan lebat',
        ]);

        // 5. Seed Logbooks for Intern 1
        Logbook::create([
            'user_id' => $intern->id,
            'date' => $today->toDateString(),
            'activity_description' => 'Melakukan refactoring endpoint API otentikasi Sanctum dan merancang skema database SI-MAGANG bersama tim programmer Aptika.',
            'verification_status' => 'approved',
            'mentor_notes' => 'Pekerjaan sangat baik dan sesuai standar PSR-12.',
            'verified_by' => $mentor->id,
        ]);

        Logbook::create([
            'user_id' => $intern->id,
            'date' => $today->copy()->subDays(1)->toDateString(),
            'activity_description' => 'Membantu instalasi server uji coba dan konfigurasi reverse proxy Nginx untuk aplikasi internal Diskominfo.',
            'verification_status' => 'approved',
            'mentor_notes' => 'Bagus, terus pelajari arsitektur microservices.',
            'verified_by' => $mentor->id,
        ]);

        Logbook::create([
            'user_id' => $intern->id,
            'date' => $today->copy()->subDays(2)->toDateString(),
            'activity_description' => 'Mempelajari modul keamanan data persandian dan membuat dokumentasi teknis sistem integrasi Satu Data.',
            'verification_status' => 'pending',
            'mentor_notes' => null,
            'verified_by' => null,
        ]);

        // 6. Seed Tasks for Intern 1
        Task::create([
            'title' => 'Pembuatan Dokumentasi REST API SI-MAGANG',
            'description' => 'Susun dokumentasi endpoint otentikasi, alur persetujuan 3 tingkat, dan manajemen sertifikat berformat OpenAPI/Swagger.',
            'assigned_to' => $intern->id,
            'created_by' => $mentor->id,
            'deadline' => Carbon::now()->addDays(3),
            'status' => 'in_progress',
            'submission_notes' => 'Draft spesifikasi endpoint 80% selesai disusun.',
        ]);

        Task::create([
            'title' => 'Uji Penetrasi dan Validasi Input Upload Berkas',
            'description' => 'Pastikan filter MIME type PDF dan batas ukuran berkas maksimum 10MB terlindungi dari kerentanan upload.',
            'assigned_to' => $intern->id,
            'created_by' => $mentor->id,
            'deadline' => Carbon::now()->subDays(1),
            'status' => 'completed',
            'submission_notes' => 'Pengujian selesai dengan menggunakan form validation Laravel.',
        ]);

        // 7. Seed Evaluation for Intern 1
        $eval = Evaluation::create([
            'intern_id' => $intern->id,
            'mentor_id' => $mentor->id,
            'discipline_score' => 92.50,
            'skill_score' => 95.00,
            'softskill_score' => 90.00,
            'final_score' => 92.75,
            'remarks' => 'Peserta magang menunjukkan inisiatif tinggi, kemampuan teknis rekayasa perangkat lunak yang matang, serta kedisiplinan kerja yang teladan.',
        ]);

        // 8. Seed Certificate with QR Hash for Intern 1
        $qrHashDemo = 'd85e7a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f';
        Certificate::create([
            'intern_id' => $intern->id,
            'certificate_number' => 'CERT/DISKOMINFO/2026/0001',
            'qr_hash' => $qrHashDemo,
            'issued_at' => Carbon::now()->subDays(2),
        ]);
    }
}
