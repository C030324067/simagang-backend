<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('status_akun')->default('pending')->after('password');
            $table->timestamp('tanggal_disetujui')->nullable()->after('status_akun');
        });

        DB::table('users')->where('role', '!=', 'applicant')->update(['status_akun' => 'approved']);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('applicant', 'intern', 'admin_kepegawaian', 'kabid', 'kadis', 'mentor'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::table('users')->where('role', 'applicant')->update(['role' => 'intern']);
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('intern', 'admin_kepegawaian', 'kabid', 'kadis', 'mentor'))");
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['status_akun', 'tanggal_disetujui']);
        });
    }
};
