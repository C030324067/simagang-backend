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
        Schema::create('intern_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('application_type', ['mandiri', 'rekomendasi_kampus']);
            $table->string('institution_name');
            $table->string('recommendation_letter_number')->nullable();
            $table->string('file_proposal')->nullable();
            $table->string('file_recommendation_letter')->nullable();
            $table->string('file_cv')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status_kepegawaian', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes_kepegawaian')->nullable();
            $table->foreignId('verified_by_kepegawaian')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status_kabid', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes_kabid')->nullable();
            $table->foreignId('verified_by_kabid')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status_kadis', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes_kadis')->nullable();
            $table->foreignId('verified_by_kadis')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('final_status', ['in_review', 'accepted', 'rejected'])->default('in_review');
            $table->foreignId('division_id')->nullable()->constrained('divisions')->nullOnDelete();
            $table->string('acceptance_letter_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intern_applications');
    }
};

