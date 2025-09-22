<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pengajuan extends Model
{
    use HasFactory;

    protected $table = 'pengajuan';

    protected $fillable = [
        'nomor_pengajuan',
        'user_id',
        'kabupaten_id',
        'nip_pegawai',
        'nama_pegawai',
        'jabatan',
        'unit_kerja',
        'pangkat_golongan',
        'jenis_pensiun',
        'status',
        'catatan',
        'tanggal_pengajuan',
        'tanggal_approval',
        'approved_by'
    ];

    protected $casts = [
        'tanggal_pengajuan' => 'datetime',
        'tanggal_approval' => 'datetime'
    ];

    /**
     * Get the user that owns the pengajuan.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the kabupaten that owns the pengajuan.
     */
    public function kabupaten()
    {
        return $this->belongsTo(Kabupaten::class);
    }

    /**
     * Get the approved by user.
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the files for the pengajuan.
     */
    public function files()
    {
        return $this->hasMany(PengajuanFile::class);
    }

    /**
     * Scope a query to only include draft pengajuan.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Scope a query to only include submitted pengajuan.
     */
    public function scopeSubmitted($query)
    {
        return $query->where('status', 'diajukan');
    }

    /**
     * Scope a query to only include approved pengajuan.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'diterima');
    }

    /**
     * Scope a query to only include rejected pengajuan.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'ditolak');
    }

    /**
     * Generate unique nomor pengajuan
     */
    public static function generateNomorPengajuan(): string
    {
        $prefix = 'PEN';
        $year = date('Y');
        $month = date('m');
        
        $lastPengajuan = self::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();
        
        if ($lastPengajuan) {
            $lastNumber = (int) substr($lastPengajuan->nomor_pengajuan, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return sprintf('%s%s%s%04d', $prefix, $year, $month, $newNumber);
    }
}
