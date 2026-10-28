<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('intern_applications', function (Blueprint $table): void {
            $table->string('jenjang')->nullable();
        });

        Schema::create('surat_balasan', function (Blueprint $table): void {
            $table->id();
            $table->string('nomor_surat')->unique();
            $table->timestamp('tanggal_terbit')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });

        Schema::table('intern_applications', function (Blueprint $table): void {
            $table->foreignId('surat_balasan_id')->nullable()->after('official_letter_number')
                ->constrained('surat_balasan')->nullOnDelete();
        });

        $legacyNumbers = DB::table('intern_applications')
            ->whereNotNull('official_letter_number')
            ->select('official_letter_number')
            ->distinct()
            ->get();
        foreach ($legacyNumbers as $legacyNumber) {
            $letterId = DB::table('surat_balasan')->insertGetId([
                'nomor_surat' => $legacyNumber->official_letter_number,
                'tanggal_terbit' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('intern_applications')
                ->where('official_letter_number', $legacyNumber->official_letter_number)
                ->update(['surat_balasan_id' => $letterId]);
        }

        foreach (['penilaian_smk', 'penilaian_kuliah'] as $tableName) {
            Schema::create($tableName, function (Blueprint $table): void {
                $table->id();
                $table->foreignId('intern_application_id')->constrained()->cascadeOnDelete();
                $table->string('aspek');
                $table->decimal('nilai', 5, 2);
                $table->text('catatan')->nullable();
                $table->foreignId('dinilai_oleh')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->unique(['intern_application_id', 'aspek']);
            });
        }

        Schema::create('aspek_penilaian_smk', function (Blueprint $table): void {
            $table->id();
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('aktif')->default(true);
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aspek_penilaian_smk');
        Schema::dropIfExists('penilaian_kuliah');
        Schema::dropIfExists('penilaian_smk');
        Schema::table('intern_applications', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('surat_balasan_id');
        });
        Schema::dropIfExists('surat_balasan');
        Schema::table('intern_applications', function (Blueprint $table): void {
            $table->dropColumn('jenjang');
        });
    }
};
