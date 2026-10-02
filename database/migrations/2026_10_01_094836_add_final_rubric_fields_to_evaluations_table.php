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
        Schema::table('evaluations', function (Blueprint $table) {
            $table->decimal('score_discipline', 5, 2)->nullable();
            $table->decimal('score_quality', 5, 2)->nullable();
            $table->decimal('score_initiative', 5, 2)->nullable();
            $table->decimal('score_teamwork', 5, 2)->nullable();
            $table->string('grade_letter', 3)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('evaluated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn([
                'score_discipline', 'score_quality', 'score_initiative',
                'score_teamwork', 'grade_letter', 'notes', 'evaluated_at',
            ]);
        });
    }
};
