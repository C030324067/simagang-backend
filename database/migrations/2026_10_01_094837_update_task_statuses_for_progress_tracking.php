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

        Schema::table('tasks', function (Blueprint $table) {
            $table->string('status', 32)->default('pending')->change();
        });

        DB::table('tasks')->where('status', 'todo')->update(['status' => 'pending']);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'revision_needed', 'completed'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check');
        }

        Schema::table('tasks', function (Blueprint $table) {
            $table->string('status', 32)->default('todo')->change();
        });

        DB::table('tasks')->whereIn('status', ['pending', 'revision_needed'])->update(['status' => 'todo']);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'completed'))");
        }
    }
};
