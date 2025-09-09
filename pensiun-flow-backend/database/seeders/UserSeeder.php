<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin Kanwil (Superadmin)
        DB::table('users')->insert([
            'nip' => '197001011990031001',
            'name' => 'Admin Kanwil NTB',
            'email' => 'adminkanwil@kemenag.go.id',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'kabupaten_id' => null,
            'jabatan' => 'Admin Kanwil Kemenag NTB',
            'status_user' => 'aktif'
        ]);

        // Admin Pusat
        DB::table('users')->insert([
            'nip' => '197501011995032002',
            'name' => 'Admin Pusat',
            'email' => 'adminpusat@kemenag.go.id',
            'password' => Hash::make('password'),
            'role' => 'adminpusat',
            'kabupaten_id' => null,
            'jabatan' => 'Admin Pusat Kemenag',
            'status_user' => 'aktif'
        ]);

        // Operators for all kabupaten/kota in NTB
        $regions = DB::table('kabupaten')->select('id','nama')->get();
        foreach ($regions as $idx => $region) {
            $slug = Str::slug($region->nama, '.');
            DB::table('users')->insert([
                'nip' => '1980'.str_pad((string)($idx+1), 10, '0', STR_PAD_LEFT),
                'name' => 'Operator '.$region->nama,
                'email' => 'operator.'.$slug.'@kemenag.go.id',
                'password' => Hash::make('password'),
                'role' => 'operator',
                'kabupaten_id' => $region->id,
                'jabatan' => 'Operator '.$region->nama,
                'status_user' => 'aktif'
            ]);
        }
    }
}
