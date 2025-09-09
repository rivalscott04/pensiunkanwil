<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Kabupaten extends Model
{
    use HasFactory;

    protected $table = 'kabupaten';

    protected $fillable = [
        'kode',
        'nama',
        'jenis',
        'kepala_daerah',
        'alamat',
        'kode_pos',
        'telepon',
        'status'
    ];

    protected $casts = [
        'status' => 'string'
    ];

    /**
     * Get the users for the kabupaten.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the pengajuan for the kabupaten.
     */
    public function pengajuan()
    {
        return $this->hasMany(Pengajuan::class);
    }

    /**
     * Scope a query to only include active kabupaten.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'aktif');
    }

    /**
     * Scope a query to only include kabupaten (not kota).
     */
    public function scopeKabupaten($query)
    {
        return $query->where('jenis', 'kabupaten');
    }

    /**
     * Scope a query to only include kota.
     */
    public function scopeKota($query)
    {
        return $query->where('jenis', 'kota');
    }
}
