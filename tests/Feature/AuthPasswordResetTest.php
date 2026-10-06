<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_registered_email_receives_a_password_reset_notification(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Jika email terdaftar, instruksi reset password akan dikirim ke email tersebut.');

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_unknown_email_gets_the_same_response_without_sending_a_notification(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'unknown@example.test',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Jika email terdaftar, instruksi reset password akan dikirim ke email tersebut.');

        Notification::assertNothingSent();
    }

    public function test_forgot_password_requires_a_valid_email(): void
    {
        $this->postJson('/api/auth/forgot-password', [
            'email' => 'not-an-email',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_reset_link_page_loads_the_application(): void
    {
        $this->get('/reset-password/reset-token?email=user%40example.test')
            ->assertOk()
            ->assertSee('id="root"', false);
    }

    public function test_valid_reset_token_updates_password_and_revokes_existing_api_tokens(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);
        $user->createToken('existing-session');
        $token = Password::createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Password berhasil diperbarui. Silakan masuk dengan password baru.');

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_invalid_reset_token_does_not_change_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => 'invalid-token',
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Tautan reset password tidak valid atau sudah kedaluwarsa.');

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }
}
