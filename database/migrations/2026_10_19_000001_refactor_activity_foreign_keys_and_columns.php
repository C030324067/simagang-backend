<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['attendances' => 'user_id', 'logbooks' => 'user_id', 'evaluations' => 'intern_id', 'certificates' => 'intern_id'] as $table => $oldKey) {
            if (Schema::hasColumn($table, $oldKey)) {
                try {
                    Schema::table($table, function (Blueprint $blueprint) use ($oldKey): void {
                        $blueprint->dropForeign([$oldKey]);
                    });
                } catch (Throwable $e) {
                    // Ignore when the foreign key is already absent.
                }
            }
            if ($table === 'attendances' && Schema::hasColumn($table, $oldKey)) {
                try {
                    Schema::table($table, function (Blueprint $blueprint): void {
                        $blueprint->dropUnique('attendances_user_id_date_unique');
                    });
                } catch (Throwable $e) {
                    // Ignore when the unique index is already absent.
                }
            }

            if (! Schema::hasColumn($table, 'intern_application_id')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->foreignId('intern_application_id')->nullable();
                });
            }

            if (Schema::hasColumn($table, $oldKey)) {
                DB::table($table)->orderBy('id')->get(['id', $oldKey])->each(function ($row) use ($table, $oldKey): void {
                    $applicationId = DB::table('intern_applications')->where('user_id', $row->{$oldKey})->orderByDesc('id')->value('id');
                    if ($applicationId) {
                        DB::table($table)->where('id', $row->id)->update(['intern_application_id' => $applicationId]);
                    }
                });
            }

            DB::table($table)->whereNull('intern_application_id')->delete();

            if (Schema::hasColumn($table, $oldKey)) {
                Schema::table($table, function (Blueprint $blueprint) use ($oldKey): void {
                    $blueprint->dropColumn($oldKey);
                });
            }

            try {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->foreign('intern_application_id')->references('id')->on('intern_applications')->cascadeOnDelete();
                });
            } catch (Throwable $e) {
                // Ignore when the new foreign key is already present.
            }

            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->unsignedBigInteger('intern_application_id')->nullable(false)->change();
            });
        }

        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropColumn(['check_in_time', 'check_out_time']);
            $table->unique(['intern_application_id', 'date']);
        });

        foreach (['discipline_score', 'skill_score', 'softskill_score', 'responsibility_score'] as $column) {
            if (Schema::hasColumn('evaluations', $column)) {
                Schema::table('evaluations', function (Blueprint $table) use ($column): void {
                    $table->dropColumn($column);
                });
            }
        }

        Schema::table('evaluations', function (Blueprint $table): void {
            if (! Schema::hasColumn('evaluations', 'score_softskill')) {
                $table->decimal('score_softskill', 5, 2)->nullable();
            }
            if (! Schema::hasColumn('evaluations', 'score_responsibility')) {
                $table->decimal('score_responsibility', 5, 2)->nullable();
            }
        });
    }

    public function down(): void
    {
        foreach (['attendances' => 'user_id', 'logbooks' => 'user_id', 'evaluations' => 'intern_id', 'certificates' => 'intern_id'] as $table => $oldKey) {
            try {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->dropForeign(['intern_application_id']);
                });
            } catch (Throwable $e) {
                // Ignore when the foreign key is already absent.
            }
            if ($table === 'attendances') {
                try {
                    Schema::table($table, function (Blueprint $blueprint): void {
                        $blueprint->dropUnique('attendances_intern_application_id_date_unique');
                    });
                } catch (Throwable $e) {
                    // Ignore when the unique index is already absent.
                }
            }
            Schema::table($table, function (Blueprint $blueprint) use ($oldKey): void {
                $blueprint->unsignedBigInteger($oldKey)->nullable();
            });

            DB::table($table)->orderBy('id')->get(['id', 'intern_application_id'])->each(function ($row) use ($table): void {
                $userId = DB::table('intern_applications')->where('id', $row->intern_application_id)->value('user_id');
                if ($userId) {
                    $oldKey = in_array($table, ['evaluations', 'certificates'], true) ? 'intern_id' : 'user_id';
                    DB::table($table)->where('id', $row->id)->update([$oldKey => $userId]);
                }
            });

            Schema::table($table, function (Blueprint $blueprint) use ($oldKey): void {
                $blueprint->dropColumn('intern_application_id');
                $blueprint->unsignedBigInteger($oldKey)->nullable(false)->change();
                $blueprint->foreign($oldKey)->references('id')->on('users')->cascadeOnDelete();
            });
        }

        Schema::table('attendances', function (Blueprint $table): void {
            $table->unique(['user_id', 'date']);
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
        });

        foreach (['score_softskill', 'score_responsibility'] as $column) {
            if (Schema::hasColumn('evaluations', $column)) {
                Schema::table('evaluations', function (Blueprint $table) use ($column): void {
                    $table->dropColumn($column);
                });
            }
        }

        Schema::table('evaluations', function (Blueprint $table): void {
            if (! Schema::hasColumn('evaluations', 'discipline_score')) {
                $table->decimal('discipline_score', 5, 2);
            }
            if (! Schema::hasColumn('evaluations', 'skill_score')) {
                $table->decimal('skill_score', 5, 2);
            }
            if (! Schema::hasColumn('evaluations', 'softskill_score')) {
                $table->decimal('softskill_score', 5, 2);
            }
            if (! Schema::hasColumn('evaluations', 'responsibility_score')) {
                $table->decimal('responsibility_score', 5, 2);
            }
        });
    }
};
