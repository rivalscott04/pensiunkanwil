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
            'name' => 'Admin Pusat',
            'email' => 'adminpusat@kemenag.go.id',
            'password' => Hash::make('password'),
            'role' => 'adminpusat',
            'kabupaten_id' => null,
            'jabatan' => 'Admin Pusat Kemenag',
            'status_user' => 'aktif'
        ]);

        // Petugas
        DB::table('users')->insert([
            'name' => 'Petugas Kemenag NTB',
            'email' => 'petugas@kemenag.go.id',
            'password' => Hash::make('password'),
            'role' => 'petugas',
            'kabupaten_id' => null,
            'jabatan' => 'Petugas Kemenag NTB',
            'status_user' => 'aktif'
        ]);

        // Operators for all kabupaten/kota in NTB
        $regions = DB::table('kabupaten')->select('id','nama','jenis')->get();
        foreach ($regions as $idx => $region) {
            // Create shorter email based on region name and type
            $regionName = strtolower($region->nama);
            
            if ($region->jenis === 'kabupaten') {
                // Remove "kabupaten" prefix and get the main name
                $regionName = trim(str_replace('kabupaten', '', $regionName));
            } elseif ($region->jenis === 'kota') {
                // Remove "kota" prefix and add "kota" prefix to main name
                $regionName = trim(str_replace('kota', '', $regionName));
                $regionName = 'kota' . $regionName;
            }
            
            // Clean up the name (remove extra spaces, etc.)
            $regionName = preg_replace('/\s+/', '', $regionName);
            
            DB::table('users')->insert([
                'name' => 'Operator '.$region->nama,
                'email' => $regionName.'@kemenag.go.id',
                'password' => Hash::make('password'),
                'role' => 'operator',
                'kabupaten_id' => $region->id,
                'jabatan' => 'Operator '.$region->nama,
                'status_user' => 'aktif'
            ]);
        }
    }
}
