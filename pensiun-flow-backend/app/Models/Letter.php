<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Letter extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

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
        'tanggal_meninggal',
        'dasar_surat',
        'pegawai_data',
        'nomor_surat_rujukan',
        'tanggal_surat_rujukan',
        'perihal_surat_rujukan',
    ];

    protected $casts = [
        'tanggal_surat' => 'date',
        'tanggal_meninggal' => 'date',
        'tanggal_surat_rujukan' => 'date',
        'pegawai_data' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }
}


