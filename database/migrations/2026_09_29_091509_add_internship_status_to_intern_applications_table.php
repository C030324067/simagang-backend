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
            $table->string('internship_status')->default('in_progress');
        });

        DB::table('intern_applications')
            ->where('final_status', 'accepted')
            ->whereIn('user_id', DB::table('evaluations')->select('intern_id'))
            ->update(['internship_status' => 'completed']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->dropColumn('internship_status');
        });
    }
};
