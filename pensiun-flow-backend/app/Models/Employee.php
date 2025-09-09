<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'nip',
        'nama',
        'jabatan',
        'golongan',
        'tmt_pensiun',
        'unit_kerja',
        'induk_unit',
    ];

    protected $casts = [
        'tmt_pensiun' => 'date',
    ];
}


