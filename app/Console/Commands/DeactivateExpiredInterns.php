<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeactivateExpiredInterns extends Command
{
    protected $signature = 'app:deactivate-expired-interns';

    protected $description = 'Menonaktifkan akun peserta yang melewati masa tenggang H+7.';

    public function handle(): int
    {
        $deactivatedCount = 0;

        User::query()
            ->whereIn('role', User::ACCOUNT_EXPIRATION_ROLES)
            ->where('status_akun', '!=', 'expired')
            ->chunkById(100, function ($users) use (&$deactivatedCount): void {
                foreach ($users as $user) {
                    if (! $user->isExpired()) {
                        continue;
                    }

                    DB::transaction(function () use ($user): void {
                        $user->forceFill(['status_akun' => 'expired', 'is_active' => false])->save();
                        $user->applications()
                            ->where('final_status', 'accepted')
                            ->update(['internship_status' => 'completed']);
                        $user->tokens()->delete();
                    });
                    $deactivatedCount++;
                }
            });

        $this->info("{$deactivatedCount} akun dinonaktifkan.");

        return self::SUCCESS;
    }
}
