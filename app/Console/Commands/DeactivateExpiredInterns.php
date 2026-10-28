<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeactivateExpiredInterns extends Command
{
    protected $signature = 'app:deactivate-expired-interns';

    protected $description = 'Menonaktifkan akun intern yang melewati masa tenggang H+7.';

    public function handle(): int
    {
        $expiredUsers = User::query()
            ->where('role', 'intern')
            ->where('is_active', true)
            ->whereHas('applications', fn ($query) => $query
                ->where('final_status', 'accepted')
                ->whereNotNull('end_date')
                ->whereDate('end_date', '<', now(config('app.timezone'))->subDays(7)->toDateString()))
            ->with(['applications' => fn ($query) => $query->where('final_status', 'accepted')->whereNotNull('end_date')->orderByDesc('end_date')])
            ->get();

        foreach ($expiredUsers as $user) {
            $latestAccepted = $user->applications->first();
            if (! $latestAccepted || now(config('app.timezone'))->toDateString() <= $latestAccepted->end_date->copy()->addDays(7)->toDateString()) {
                continue;
            }

            DB::transaction(function () use ($user): void {
                $user->forceFill(['status_akun' => 'expired', 'is_active' => false])->save();
                $user->tokens()->delete();
            });
        }

        $this->info("{$expiredUsers->count()} akun diperiksa untuk penonaktifan.");

        return self::SUCCESS;
    }
}
