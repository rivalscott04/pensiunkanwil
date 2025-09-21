<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Letter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nomor_surat',
        'tanggal_surat',
        'nama_pegawai',
        'nip_pegawai',
        'posisi_pegawai',
        'unit_pegawai',
        'nama_penandatangan',
        'nip_penandatangan',
        'jabatan_penandatangan',
        'signature_place',
        'signature_date_input',
        'signature_mode',
        'signature_anchor',
        'template_version',
        'type',
        'perihal',
        'addressee_jabatan',
        'addressee_kota',
    ];

    protected $casts = [
        'tanggal_surat' => 'date',
    ];
}


