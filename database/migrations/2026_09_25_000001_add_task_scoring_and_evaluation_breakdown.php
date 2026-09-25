<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->decimal('score', 5, 2)->nullable();
            $table->text('mentor_feedback')->nullable();
        });

        Schema::table('evaluations', function (Blueprint $table) {
            $table->decimal('responsibility_score', 5, 2)->default(0);
            $table->decimal('task_average', 5, 2)->default(0);
            $table->decimal('attendance_percentage', 5, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn(['responsibility_score', 'task_average', 'attendance_percentage']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['score', 'mentor_feedback']);
        });
    }
};
