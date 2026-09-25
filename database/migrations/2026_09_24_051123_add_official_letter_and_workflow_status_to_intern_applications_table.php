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
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->string('status')->default('pending_kepegawaian')->index();
            $table->text('rejection_note')->nullable();
            $table->string('official_letter_path')->nullable();
        });

        DB::table('intern_applications')->where('final_status', 'rejected')->update(['status' => 'rejected']);
        DB::table('intern_applications')->where('status_kadis', 'approved')->update(['status' => 'approved_kadis']);
        DB::table('intern_applications')->where('status_kabid', 'approved')->where('status_kadis', 'pending')->update(['status' => 'review_kadis']);
        DB::table('intern_applications')->where('status_kepegawaian', 'approved')->where('status_kabid', 'pending')->update(['status' => 'review_kabid']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'rejection_note', 'official_letter_path']);
        });
    }
};
