<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

#[Signature('app:clear-internal-account-expirations')]
#[Description('Clear account and personal access token expiration dates for internal users.')]
class ClearInternalAccountExpirations extends Command
{
    public function handle(): int
    {
        $userExpirationCount = 0;
        foreach (['expires_at', 'account_expires_at', 'tanggal_berakhir_akun'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                $userExpirationCount += DB::table('users')
                    ->whereIn('role', User::INTERNAL_ROLES)
                    ->whereNotNull($column)
                    ->update([$column => null]);
            }
        }

        $tokenExpirationCount = 0;
        if (Schema::hasTable('personal_access_tokens') && Schema::hasColumn('personal_access_tokens', 'expires_at')) {
            $internalUserIds = User::query()
                ->whereIn('role', User::INTERNAL_ROLES)
                ->select('id');

            $tokenExpirationCount = DB::table('personal_access_tokens')
                ->where('tokenable_type', (new User)->getMorphClass())
                ->whereIn('tokenable_id', $internalUserIds)
                ->whereNotNull('expires_at')
                ->update(['expires_at' => null]);
        }

        $this->info("Tanggal kedaluwarsa user dibersihkan: {$userExpirationCount}; token internal dibersihkan: {$tokenExpirationCount}.");

        return self::SUCCESS;
    }
}
