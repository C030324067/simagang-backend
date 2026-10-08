<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DivisionSeeder::class,
            MentorSeeder::class,
            HolidaySeeder::class,
        ]);

        $defaultPassword = Hash::make('password123');

        User::updateOrCreate(
            ['email' => 'kadis@diskominfo.go.id'],
            [
                'name' => 'Eddy Suriyani, S.Sos., MA',
                'role' => 'kadis',
                'status_akun' => 'approved',
                'password' => $defaultPassword,
            ]
        );
    }
}
