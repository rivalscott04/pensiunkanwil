<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KabupatenSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kabupaten = [
            [
                'kode' => '5201',
                'nama' => 'Kabupaten Lombok Barat',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Zulkieflimansyah, S.E., M.M.',
                'alamat' => 'Jl. Raya Mataram-Gerung, Gerung, Lombok Barat',
                'kode_pos' => '83311',
                'telepon' => '0370-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5202',
                'nama' => 'Kabupaten Lombok Tengah',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Lalu Pathul Bahri, S.H.',
                'alamat' => 'Jl. Pejanggik No. 1, Praya, Lombok Tengah',
                'kode_pos' => '83511',
                'telepon' => '0370-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5203',
                'nama' => 'Kabupaten Lombok Timur',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. M. Sukiman Azmy, S.Sos.',
                'alamat' => 'Jl. Soekarno-Hatta No. 1, Selong, Lombok Timur',
                'kode_pos' => '83611',
                'telepon' => '0376-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5204',
                'nama' => 'Kabupaten Sumbawa',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Mahmud Abdullah, S.H.',
                'alamat' => 'Jl. Garuda No. 1, Sumbawa Besar',
                'kode_pos' => '84311',
                'telepon' => '0371-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5205',
                'nama' => 'Kabupaten Dompu',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Kader Jaelani, S.Sos.',
                'alamat' => 'Jl. Soekarno-Hatta No. 1, Dompu',
                'kode_pos' => '84211',
                'telepon' => '0373-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5206',
                'nama' => 'Kabupaten Bima',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Indah Dhamayanti, S.E.',
                'alamat' => 'Jl. Soekarno-Hatta No. 1, Woha, Bima',
                'kode_pos' => '84111',
                'telepon' => '0374-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5207',
                'nama' => 'Kabupaten Sumbawa Barat',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. W. Musyafirin, S.H.',
                'alamat' => 'Jl. Raya Taliwang-Sumbawa Besar, Taliwang',
                'kode_pos' => '84411',
                'telepon' => '0372-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5271',
                'nama' => 'Kota Mataram',
                'jenis' => 'kota',
                'kepala_daerah' => 'H. Mohan Roliskana, S.Sos., M.M.',
                'alamat' => 'Jl. Langko No. 1, Mataram',
                'kode_pos' => '83111',
                'telepon' => '0370-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5272',
                'nama' => 'Kota Bima',
                'jenis' => 'kota',
                'kepala_daerah' => 'H. Muhammad Lutfi, S.E.',
                'alamat' => 'Jl. Soekarno-Hatta No. 1, Bima',
                'kode_pos' => '84111',
                'telepon' => '0374-612345',
                'status' => 'aktif'
            ],
            [
                'kode' => '5208',
                'nama' => 'Kabupaten Lombok Utara',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Djohan Sjamsu, S.H.',
                'alamat' => 'Jl. Raya Tanjung, Tanjung, Lombok Utara',
                'kode_pos' => '83552',
                'telepon' => '0370-612345',
                'status' => 'aktif'
            ]
        ];

        foreach ($kabupaten as $data) {
            DB::table('kabupaten')->insert($data);
        }
    }
}
