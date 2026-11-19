<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('divisions')
            ->where('name', 'Bidang Informasi dan Komunikasi Publik (IKP)')
            ->update(['name' => 'Bidang Informasi dan Komunikasi Publik']);
    }

    public function down(): void {}
};
