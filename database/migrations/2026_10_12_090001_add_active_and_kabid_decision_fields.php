<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_active')->default(true)->index();
        });

        if (Schema::hasColumn('users', 'status_akun')) {
            DB::table('users')
                ->where('status_akun', '!=', 'approved')
                ->update(['is_active' => false]);
        }

        Schema::table('intern_applications', function (Blueprint $table): void {
            $table->timestamp('kabid_decided_at')->nullable();
            $table->timestamp('kabid_rejected_at')->nullable();
            $table->string('rejection_stage')->nullable();
        });

        Schema::create('intern_application_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('intern_application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_role');
            $table->string('from_status');
            $table->string('to_status');
            $table->string('decision');
            $table->text('notes')->nullable();
            $table->timestamp('decided_at');
            $table->timestamps();

            $table->index(['intern_application_id', 'decided_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intern_application_histories');

        Schema::table('intern_applications', function (Blueprint $table): void {
            $table->dropColumn(['kabid_decided_at', 'kabid_rejected_at', 'rejection_stage']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['is_active']);
            $table->dropColumn('is_active');
        });
    }
};
