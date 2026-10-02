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
        Schema::table('attendances', function (Blueprint $table) {
            $table->timestamp('clock_in_at')->nullable();
            $table->timestamp('clock_out_at')->nullable();
            $table->string('selfie_path')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_within_radius')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('approval_status')->default('pending_approval');
            $table->text('rejection_reason')->nullable();
            $table->index(['approval_status', 'date']);
        });
        DB::table('attendances')->update(['approval_status' => 'approved']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['approval_status', 'date']);
            $table->dropColumn([
                'clock_in_at', 'clock_out_at', 'selfie_path', 'latitude', 'longitude',
                'is_within_radius', 'attachment_path', 'approval_status', 'rejection_reason',
            ]);
        });
    }
};
