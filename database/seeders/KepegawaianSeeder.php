<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class KepegawaianSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'kepegawaian@diskominfo.go.id'],
            [
                'name' => 'Admin Kepegawaian',
                'role' => 'admin_kepegawaian',
                'status_akun' => 'approved',
                'is_active' => true,
                'password' => Hash::make('password123'),
            ],
        );
    }
}
