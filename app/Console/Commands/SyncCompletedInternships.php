<?php

namespace App\Console\Commands;

use App\Models\InternApplication;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

#[Signature('app:sync-completed-internships')]
#[Description('Synchronize completed internship statuses from certificates, end dates, and account expiration.')]
class SyncCompletedInternships extends Command
{
    public function handle(): int
    {
        $completedCount = 0;
        $expiredUsersCount = 0;
        $expiredUserIds = [];
        $today = now(config('app.timezone'))->toDateString();

        InternApplication::query()
            ->where(function (Builder $query): void {
                $query->where('final_status', 'accepted')
                    ->orWhereHas('certificate');
            })
            ->with(['user.internApplication', 'certificate'])
            ->chunkById(100, function (Collection $applications) use ($today, &$completedCount, &$expiredUsersCount, &$expiredUserIds): void {
                foreach ($applications as $application) {
                    $user = $application->user;
                    $accountExpired = $user?->isExpired() ?? false;
                    $endDate = $application->end_date?->toDateString();
                    $endDatePassed = $endDate !== null && $endDate < $today;

                    if (! $application->certificate && ! $endDatePassed && ! $accountExpired) {
                        continue;
                    }

                    DB::transaction(function () use ($application, $user, $accountExpired, &$completedCount, &$expiredUsersCount, &$expiredUserIds): void {
                        if ($accountExpired && $user && ! isset($expiredUserIds[$user->id])) {
                            $user->forceFill(['status_akun' => 'expired', 'is_active' => false])->save();
                            $user->tokens()->delete();
                            $expiredUserIds[$user->id] = true;
                            $expiredUsersCount++;
                        }

                        if ($application->internship_status !== 'completed') {
                            $application->update(['internship_status' => 'completed']);
                            $completedCount++;
                        }
                    });
                }
            });

        $this->info("Permohonan ditandai selesai: {$completedCount}; akun peserta kedaluwarsa disinkronkan: {$expiredUsersCount}.");

        return self::SUCCESS;
    }
}
