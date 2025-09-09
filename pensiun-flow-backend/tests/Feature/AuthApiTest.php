<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh --seed');
    }

    public function test_login_with_valid_credentials_returns_token_and_user(): void
    {
        $email = 'superadmin@pensiun-flow.test';
        $password = 'password';

        $response = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => $password,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status', 'message', 'data' => [
                    'user' => ['id','nip','name','email','role','kabupaten','jabatan'],
                    'token', 'token_type'
                ]
            ]);
    }

    public function test_me_returns_authenticated_user_when_token_present(): void
    {
        $user = User::where('email', 'superadmin@pensiun-flow.test')->first();

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(200);

        $token = $login->json('data.token');

        $me = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/user')
            ->assertStatus(200)
            ->assertJsonStructure([
                'status', 'data' => [
                    'user' => ['id','nip','name','email','role','kabupaten','jabatan','status_user','last_login']
                ]
            ]);
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::where('email', 'superadmin@pensiun-flow.test')->first();

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(200);

        $token = $login->json('data.token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertStatus(200);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/user')
            ->assertStatus(401);
    }
}
