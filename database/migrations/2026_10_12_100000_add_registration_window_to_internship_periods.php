<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internship_periods', function (Blueprint $table): void {
            $table->date('start_date')->nullable()->after('monthly_quota');
            $table->date('end_date')->nullable()->after('start_date');
            $table->boolean('is_active')->default(true)->after('end_date')->index();
        });
    }

    public function down(): void
    {
        Schema::table('internship_periods', function (Blueprint $table): void {
            $table->dropIndex(['is_active']);
            $table->dropColumn(['start_date', 'end_date', 'is_active']);
        });
    }
};
