<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Logbook;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttendanceLogbookTest extends TestCase
{
    use RefreshDatabase;

    private User $intern;
    private User $mentor;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->intern = User::factory()->create(['role' => 'intern']);
        $this->mentor = User::factory()->create(['role' => 'mentor']);
    }

    public function test_intern_can_check_in_and_check_out(): void
    {
        $photoIn = UploadedFile::fake()->image('selfie_in.jpg');

        $checkInResponse = $this->actingAs($this->intern, 'sanctum')->postJson('/api/attendances/check-in', [
            'photo' => $photoIn,
            'notes' => 'Presensi pagi',
        ]);

        $checkInResponse->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->intern->id,
            'date' => Carbon::today()->toDateString(),
        ]);

        // Duplicate check in should fail
        $this->actingAs($this->intern, 'sanctum')->postJson('/api/attendances/check-in')
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        // Check-out
        $photoOut = UploadedFile::fake()->image('selfie_out.jpg');
        $checkOutResponse = $this->actingAs($this->intern, 'sanctum')->postJson('/api/attendances/check-out', [
            'photo' => $photoOut,
        ]);

        $checkOutResponse->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_intern_submits_logbook_and_mentor_verifies(): void
    {
        $file = UploadedFile::fake()->create('report.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->intern, 'sanctum')->postJson('/api/logbooks', [
            'date' => Carbon::today()->toDateString(),
            'activity_description' => 'Mengembangkan antarmuka sistem absensi digital menggunakan React.',
            'attachment' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.verification_status', 'pending');

        $logbookId = $response->json('data.id');

        // Mentor verifies logbook
        $verifyResponse = $this->actingAs($this->mentor, 'sanctum')
            ->putJson("/api/logbooks/{$logbookId}/verify", [
                'verification_status' => 'approved',
                'mentor_notes' => 'Pekerjaan terverifikasi dengan hasil memuaskan.',
            ]);

        $verifyResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.verification_status', 'approved')
            ->assertJsonPath('data.verified_by', $this->mentor->id);
    }
}

