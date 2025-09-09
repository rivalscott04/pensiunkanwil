<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LettersApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh --seed');
    }

    private function authHeaders(): array
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'superadmin@pensiun-flow.test',
            'password' => 'password',
        ])->assertStatus(200);
        $token = $login->json('data.token');
        return [ 'Authorization' => 'Bearer '.$token ];
    }

    public function test_crud_letters(): void
    {
        $headers = $this->authHeaders();

        // Create
        $payload = [
            'nomor_surat' => 'B-999/Kw.18.1/2/Kp.01.2/01/2025',
            'tanggal_surat' => '2025-01-01',
            'nama_pegawai' => 'Budi',
            'nip_pegawai' => '123',
            'posisi_pegawai' => 'Staf',
            'unit_pegawai' => 'Unit A',
            'nama_penandatangan' => 'Kepala',
            'nip_penandatangan' => '321',
            'jabatan_penandatangan' => 'Kepala Kantor',
            'signature_place' => 'Mataram',
            'signature_date_input' => '2025-01-01',
            'signature_mode' => 'manual',
            'signature_anchor' => '^',
            'template_version' => 'v1',
        ];

        $created = $this->withHeaders($headers)->postJson('/api/letters', $payload)
            ->assertStatus(201)
            ->json();

        $id = $created['id'] ?? null;
        $this->assertNotNull($id);

        // Index
        $this->withHeaders($headers)->getJson('/api/letters')
            ->assertStatus(200);

        // Show
        $this->withHeaders($headers)->getJson('/api/letters/'.$id)
            ->assertStatus(200)
            ->assertJsonFragment([ 'nomor_surat' => $payload['nomor_surat'] ]);

        // Update
        $this->withHeaders($headers)->putJson('/api/letters/'.$id, [ 'nama_pegawai' => 'Budi Santoso' ] + $payload)
            ->assertStatus(200)
            ->assertJsonFragment([ 'nama_pegawai' => 'Budi Santoso' ]);

        // Delete
        $this->withHeaders($headers)->deleteJson('/api/letters/'.$id)
            ->assertStatus(200)
            ->assertJsonFragment([ 'deleted' => true ]);
    }
}


