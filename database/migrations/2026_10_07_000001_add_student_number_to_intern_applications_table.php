<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->string('student_number', 50)->nullable()->after('major');
        });
    }

    public function down(): void
    {
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->dropColumn('student_number');
        });
    }
};
