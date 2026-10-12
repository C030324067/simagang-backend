<?php

namespace App\Console\Commands;

use App\Models\InternApplication;
use App\Notifications\ApplicationExpiredNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class CheckExpiredApplications extends Command
{
    protected $signature = 'applications:expire-pending';

    protected $description = 'Reject pending applications that exceeded the seven-day verification deadline';

    public function handle(): int
    {
        $cutoff = now()->subDays(7);
        $expiredCount = 0;

        InternApplication::query()
            ->with('user')
            ->whereIn('status', ['pending', 'pending_kepegawaian'])
            ->where('status_kepegawaian', 'pending')
            ->where('created_at', '<', $cutoff)
            ->chunkById(100, function ($applications) use (&$expiredCount): void {
                foreach ($applications as $application) {
                    $updated = DB::transaction(function () use ($application): bool {
                        $lockedApplication = InternApplication::query()
                            ->whereKey($application->id)
                            ->lockForUpdate()
                            ->whereIn('status', ['pending', 'pending_kepegawaian'])
                            ->where('status_kepegawaian', 'pending')
                            ->where('created_at', '<', now()->subDays(7))
                            ->first();

                        if (! $lockedApplication) {
                            return false;
                        }

                        $lockedApplication->forceFill([
                            'status' => 'rejected',
                            'status_kepegawaian' => 'rejected',
                            'final_status' => 'rejected',
                            'rejection_note' => InternApplication::AUTO_EXPIRATION_REJECTION_REASON,
                        ])->save();

                        return true;
                    });

                    if (! $updated) {
                        continue;
                    }

                    $expiredCount++;
                    $deadline = $application->created_at->copy()->addDays(7);

                    try {
                        $application->user->notifyNow(new ApplicationExpiredNotification(
                            InternApplication::AUTO_EXPIRATION_REJECTION_REASON,
                            $deadline->toDateTimeString(),
                        ));
                    } catch (Throwable $exception) {
                        Log::error('Gagal mengirim notifikasi pendaftaran magang yang gugur otomatis.', [
                            'application_id' => $application->id,
                            'user_id' => $application->user_id,
                            'exception' => $exception,
                        ]);
                    }
                }
            });

        $this->info("{$expiredCount} pendaftaran kedaluwarsa ditolak otomatis.");

        return self::SUCCESS;
    }
}
