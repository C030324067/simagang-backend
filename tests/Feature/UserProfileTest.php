<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('supportedRoles')]
    public function test_authenticated_users_of_each_role_can_change_their_password(string $role): void
    {
        $user = User::factory()->create([
            'role' => $role,
            'password' => Hash::make('current-password'),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/change-password', [
                'current_password' => 'current-password',
                'new_password' => 'replacement-password',
                'new_password_confirmation' => 'replacement-password',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Password berhasil diperbarui.');

        $this->assertTrue(Hash::check('replacement-password', $user->fresh()->password));
    }

    public function test_change_password_requires_authentication(): void
    {
        $this->postJson('/api/change-password', [
            'current_password' => 'current-password',
            'new_password' => 'replacement-password',
            'new_password_confirmation' => 'replacement-password',
        ])->assertUnauthorized();
    }

    public function test_change_password_rejects_an_incorrect_current_password_without_updating_it(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('current-password'),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/change-password', [
                'current_password' => 'incorrect-password',
                'new_password' => 'replacement-password',
                'new_password_confirmation' => 'replacement-password',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Password saat ini tidak sesuai.');

        $this->assertTrue(Hash::check('current-password', $user->fresh()->password));
    }

    public function test_change_password_validates_password_confirmation_and_minimum_length(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('current-password'),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/change-password', [
                'current_password' => 'current-password',
                'new_password' => 'short',
                'new_password_confirmation' => 'different',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['new_password']);

        $this->assertTrue(Hash::check('current-password', $user->fresh()->password));
    }

    public static function supportedRoles(): array
    {
        return [
            'intern' => ['intern'],
            'admin kepegawaian' => ['admin_kepegawaian'],
            'kepala bidang' => ['kabid'],
            'kepala dinas' => ['kadis'],
            'mentor' => ['mentor'],
        ];
    }
}
