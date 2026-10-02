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
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('division_id')->nullable()->constrained('divisions')->nullOnDelete();
        });

        DB::table('tasks')
            ->whereExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('users')
                ->whereColumn('users.id', 'tasks.created_by')
                ->whereNotNull('users.division_id'))
            ->update([
                'division_id' => DB::raw('(SELECT division_id FROM users WHERE users.id = tasks.created_by)'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('division_id');
        });
    }
};
