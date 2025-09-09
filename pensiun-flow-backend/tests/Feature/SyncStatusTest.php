<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class SyncStatusTest extends TestCase
{
    public function test_requires_authentication(): void
    {
        $this->getJson('/api/sync/status')->assertStatus(401);
    }

    public function test_returns_last_sync_and_count(): void
    {
        $user = User::factory()->create([
            'role' => 'superadmin',
            'status_user' => 'aktif',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($user);

        $this->getJson('/api/sync/status')
            ->assertOk()
            ->assertJsonStructure([
                'last_sync_at',
                'employees_count',
            ]);
    }
}


