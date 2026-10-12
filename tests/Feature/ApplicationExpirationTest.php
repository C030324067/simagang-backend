<?php

namespace Tests\Feature;

use App\Models\InternApplication;
use App\Models\User;
use App\Notifications\ApplicationExpiredNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ApplicationExpirationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-12 12:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_expired_pending_applications_are_rejected_and_the_applicant_is_notified(): void
    {
        Notification::fake();
        $applicant = User::factory()->create(['role' => 'applicant']);
        $application = $this->createPendingApplication($applicant, Carbon::now()->subDays(8));
        $this->assertSame('2026-10-12 12:00:00', now()->toDateTimeString());
        $this->assertSame('2026-10-04 12:00:00', $application->fresh()->created_at->toDateTimeString());
        $this->assertSame(1, InternApplication::query()
            ->where('id', $application->id)
            ->where('created_at', '<', now()->subDays(7))
            ->count());

        $this->artisan('applications:expire-pending')
            ->expectsOutputToContain('1 pendaftaran kedaluwarsa ditolak otomatis.')
            ->assertExitCode(0);

        $this->assertDatabaseHas('intern_applications', [
            'id' => $application->id,
            'status' => 'rejected',
            'status_kepegawaian' => 'rejected',
            'final_status' => 'rejected',
            'rejection_note' => InternApplication::AUTO_EXPIRATION_REJECTION_REASON,
        ]);
        Notification::assertSentTo($applicant, ApplicationExpiredNotification::class);

        $this->getJson("/api/applications/track/{$application->tracking_code}")
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.auto_rejected', true)
            ->assertJsonPath('data.rejection_reason', InternApplication::AUTO_EXPIRATION_REJECTION_REASON)
            ->assertJsonPath('data.verification_deadline', '2026-10-11T12:00:00+08:00');
    }

    public function test_pending_applications_at_or_under_seven_days_are_not_expired(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $application = $this->createPendingApplication($applicant, Carbon::now()->subDays(7));

        $this->artisan('applications:expire-pending')
            ->assertExitCode(0);

        $this->assertDatabaseHas('intern_applications', [
            'id' => $application->id,
            'status' => 'pending_kepegawaian',
            'status_kepegawaian' => 'pending',
        ]);
    }

    private function createPendingApplication(User $applicant, Carbon $createdAt): InternApplication
    {
        $application = InternApplication::create([
            'user_id' => $applicant->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Tabalong',
            'start_date' => '2026-11-01',
            'end_date' => '2027-01-31',
            'status' => 'pending_kepegawaian',
            'status_kepegawaian' => 'pending',
            'final_status' => 'in_review',
        ]);
        $application->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();

        return $application;
    }
}
