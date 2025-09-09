<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EmployeesIndexTest extends TestCase
{
    public function test_requires_authentication(): void
    {
        $this->getJson('/api/employees')->assertStatus(401);
    }

    public function test_lists_paginated_employees(): void
    {
        $user = User::factory()->create([
            'role' => 'superadmin',
            'status_user' => 'aktif',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($user);

        // Seed a couple of employees
        DB::table('employees')->insert([
            [
                'nip' => '197001011991031001',
                'nama' => 'John Doe',
                'jabatan' => 'Staff',
                'golongan' => 'III/a',
                'tmt_pensiun' => '2030-01-01',
                'unit_kerja' => 'Unit A',
                'induk_unit' => 'Kantor A',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nip' => '197105152000032002',
                'nama' => 'Jane Smith',
                'jabatan' => 'Staff',
                'golongan' => 'III/b',
                'tmt_pensiun' => '2031-05-15',
                'unit_kerja' => 'Unit B',
                'induk_unit' => 'Kantor B',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->getJson('/api/employees')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_eligible_employees_endpoint_filters_by_tmt_pensiun_lte_today(): void
    {
        $user = User::factory()->create([
            'role' => 'superadmin',
            'status_user' => 'aktif',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($user);

        $today = now()->toDateString();
        $future = now()->addDay()->toDateString();

        DB::table('employees')->insert([
            [
                'nip' => '111',
                'nama' => 'Eligible One',
                'jabatan' => 'Staff',
                'golongan' => 'III/a',
                'tmt_pensiun' => $today,
                'unit_kerja' => 'Unit X',
                'induk_unit' => 'Kankemenag',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nip' => '222',
                'nama' => 'Not Yet',
                'jabatan' => 'Staff',
                'golongan' => 'III/b',
                'tmt_pensiun' => $future,
                'unit_kerja' => 'Unit Y',
                'induk_unit' => 'Kankemenag',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->getJson('/api/pengajuan/eligible-employees')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta'])
            ->assertJsonFragment(['nama' => 'Eligible One'])
            ->assertJsonMissing(['nama' => 'Not Yet']);
    }
}


