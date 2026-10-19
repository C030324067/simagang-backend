<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'date']);
        });
        foreach (['attendances' => 'user_id', 'logbooks' => 'user_id', 'evaluations' => 'intern_id', 'certificates' => 'intern_id'] as $table => $oldKey) {
            Schema::table($table, function (Blueprint $blueprint) use ($oldKey): void {
                $blueprint->dropForeign([$oldKey]);
            });
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->foreignId('intern_application_id')->nullable()->constrained('intern_applications')->cascadeOnDelete();
            });
            DB::table($table)->orderBy('id')->get(['id', $oldKey])->each(function ($row) use ($table, $oldKey): void {
                $applicationId = DB::table('intern_applications')->where('user_id', $row->{$oldKey})->orderByDesc('id')->value('id');
                if ($applicationId) {
                    DB::table($table)->where('id', $row->id)->update(['intern_application_id' => $applicationId]);
                }
            });
            Schema::table($table, function (Blueprint $blueprint) use ($oldKey): void {
                $blueprint->dropColumn($oldKey);
                $blueprint->unsignedBigInteger('intern_application_id')->nullable(false)->change();
            });
        }

        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropColumn(['check_in_time', 'check_out_time']);
            $table->unique(['intern_application_id', 'date']);
        });

        Schema::table('evaluations', function (Blueprint $table): void {
            $table->dropColumn(['discipline_score', 'skill_score', 'softskill_score', 'responsibility_score']);
            $table->decimal('score_softskill', 5, 2)->nullable();
            $table->decimal('score_responsibility', 5, 2)->nullable();
        });
    }

    public function down(): void
    {
        // The original user links cannot be reconstructed uniquely after an intern has multiple applications.
        throw new RuntimeException('This migration is intentionally irreversible because activity rows now belong to a specific application.');
    }
};
