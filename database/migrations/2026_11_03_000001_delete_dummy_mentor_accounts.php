<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $dummyMentorIds = DB::table('users')
            ->where('role', 'mentor')
            ->get(['id', 'name', 'email'])
            ->filter(fn (object $user): bool => str_starts_with(mb_strtolower(trim($user->name)), 'mentor ')
                || preg_match('/^mentor\d+\.[a-z0-9_-]+@/i', $user->email) === 1)
            ->pluck('id');

        if ($dummyMentorIds->isNotEmpty()) {
            DB::table('users')->whereIn('id', $dummyMentorIds)->delete();
        }
    }

    public function down(): void
    {
        // Deleted dummy accounts cannot be restored without their original credentials.
    }
};
