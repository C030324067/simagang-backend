<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('attendances')->where('approval_status', 'pending_approval')->update(['approval_status' => 'approved']);
        DB::table('logbooks')->where('verification_status', 'pending')->update(['verification_status' => 'approved']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Historical pending values cannot be restored reliably.
    }
};
