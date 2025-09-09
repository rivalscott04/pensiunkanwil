<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PengajuanFile extends Model
{
    use HasFactory;

    protected $table = 'pengajuan_files';

    protected $fillable = [
        'pengajuan_id',
        'nama_file',
        'nama_asli',
        'path',
        'mime_type',
        'size',
        'jenis_dokumen',
        'is_required',
        'keterangan'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'size' => 'integer'
    ];

    /**
     * Get the pengajuan that owns the file.
     */
    public function pengajuan()
    {
        return $this->belongsTo(Pengajuan::class);
    }

    /**
     * Get the file size in human readable format.
     */
    public function getSizeHumanAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if file is PDF
     */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    /**
     * Check if file is image
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Get file extension
     */
    public function getExtensionAttribute(): string
    {
        return pathinfo($this->nama_asli, PATHINFO_EXTENSION);
    }

    /**
     * Scope a query to only include required documents.
     */
    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    /**
     * Scope a query to only include optional documents.
     */
    public function scopeOptional($query)
    {
        return $query->where('is_required', false);
    }
}
