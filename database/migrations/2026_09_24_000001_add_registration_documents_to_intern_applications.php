<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->string('major')->nullable();
            $table->string('cover_letter_path')->nullable();
            $table->string('transcript_path')->nullable();
            $table->string('student_card_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->dropColumn(['major', 'cover_letter_path', 'transcript_path', 'student_card_path']);
        });
    }
};
