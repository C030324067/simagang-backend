<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->string('task_file_path')->nullable();
            $table->string('task_file_name')->nullable();
            $table->string('revision_file_path')->nullable();
            $table->string('revision_file_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn([
                'task_file_path',
                'task_file_name',
                'revision_file_path',
                'revision_file_name',
            ]);
        });
    }
};
