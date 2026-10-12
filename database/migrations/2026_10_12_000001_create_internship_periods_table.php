<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internship_periods', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('division_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('quarter');
            $table->unsignedTinyInteger('month');
            $table->unsignedInteger('monthly_quota');
            $table->timestamps();

            $table->unique(['division_id', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internship_periods');
    }
};
