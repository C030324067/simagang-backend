<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->string('official_letter_number')->nullable()->unique()->after('acceptance_letter_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('intern_applications', function (Blueprint $table) {
            $table->dropColumn('official_letter_number');
        });
    }
};
