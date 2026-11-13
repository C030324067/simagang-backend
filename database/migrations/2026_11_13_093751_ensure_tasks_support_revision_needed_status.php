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
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check');
        }

        Schema::table('tasks', function (Blueprint $table): void {
            $table->string('status', 32)->default('pending')->change();
        });

        DB::table('tasks')->whereIn('status', ['todo', 'perlu revisi', 'perlu_revisi', 'revision'])->update([
            'status' => DB::raw("CASE WHEN status = 'todo' THEN 'pending' ELSE 'revision_needed' END"),
        ]);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'revision_needed', 'completed'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep the string column and revision status to avoid data loss on rollback.
    }
};
