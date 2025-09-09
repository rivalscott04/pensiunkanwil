<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use App\Jobs\SyncEmployeesJob;

class SyncEmployeesTest extends TestCase
{
    public function test_only_authenticated_user_can_trigger_sync(): void
    {
        $this->postJson('/api/sync/employees')->assertStatus(401);
    }

    public function test_admin_can_queue_sync_job(): void
    {
        Queue::fake();

        $user = User::factory()->create([
            'role' => 'superadmin',
            'status_user' => 'aktif',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($user);

        $this->postJson('/api/sync/employees')
            ->assertStatus(202)
            ->assertJson(['status' => 'accepted']);

        Queue::assertPushed(SyncEmployeesJob::class);
    }
}







