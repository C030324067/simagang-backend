<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\InternApplication;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CertificateVerificationTest extends TestCase
{
    use RefreshDatabase;

    private Division $division;
    private User $intern;
    private User $mentor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->division = Division::create([
            'name' => 'Bidang Aplikasi Informatika',
            'code' => 'APTIKA',
        ]);

        $this->intern = User::factory()->create([
            'role' => 'intern',
            'division_id' => $this->division->id,
        ]);

        $this->mentor = User::factory()->create([
            'role' => 'mentor',
            'division_id' => $this->division->id,
        ]);

        InternApplication::create([
            'user_id' => $this->intern->id,
            'application_type' => 'mandiri',
            'institution_name' => 'Universitas Indonesia',
            'start_date' => Carbon::today()->subDays(60)->toDateString(),
            'end_date' => Carbon::today()->toDateString(),
            'final_status' => 'accepted',
            'division_id' => $this->division->id,
        ]);
    }

    public function test_mentor_evaluates_and_generates_verifiable_certificate(): void
    {
        // 1. Mentor submits evaluation with scores: 90, 80, 85 -> final: (90*0.3 + 80*0.4 + 85*0.3) = 27 + 32 + 25.5 = 84.5
        $evalResponse = $this->actingAs($this->mentor, 'sanctum')->postJson('/api/evaluations', [
            'intern_id' => $this->intern->id,
            'discipline_score' => 90,
            'skill_score' => 80,
            'softskill_score' => 85,
            'remarks' => 'Kinerja sangat memuaskan.',
        ]);

        $evalResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.final_score', '84.50');

        // 2. Generate Certificate
        $certResponse = $this->actingAs($this->mentor, 'sanctum')->postJson('/api/certificates/generate', [
            'intern_id' => $this->intern->id,
        ]);

        $certResponse->assertStatus(201)
            ->assertJsonPath('success', true);

        $qrHash = $certResponse->json('data.qr_hash');
        $this->assertNotEmpty($qrHash);

        // 3. Public QR Code Verification endpoint (no auth needed)
        $publicVerifyResponse = $this->getJson("/api/public/verify-cert/{$qrHash}");

        $publicVerifyResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.intern.name', $this->intern->name)
            ->assertJsonPath('data.intern.division', 'Bidang Aplikasi Informatika')
            ->assertJsonPath('data.evaluation.final_score', '84.50');
    }

    public function test_public_verification_returns_404_for_invalid_qr_hash(): void
    {
        $response = $this->getJson('/api/public/verify-cert/invalid-non-existent-hash');

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }
}

