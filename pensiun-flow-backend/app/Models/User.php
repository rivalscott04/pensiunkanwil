<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Lab404\Impersonate\Models\Impersonate;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, Impersonate;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nip',
        'name',
        'email',
        'password',
        'role',
        'kabupaten_id',
        'jabatan',
        'status_user',
        'last_login'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login' => 'datetime',
        ];
    }

    /**
     * Get the kabupaten that owns the user.
     */
    public function kabupaten()
    {
        return $this->belongsTo(Kabupaten::class);
    }

    /**
     * Get the pengajuan for the user.
     */
    public function pengajuan()
    {
        return $this->hasMany(Pengajuan::class);
    }

    /**
     * Get the approved pengajuan for the user.
     */
    public function approvedPengajuan()
    {
        return $this->hasMany(Pengajuan::class, 'approved_by');
    }

    /**
     * Get the activity logs for the user.
     */
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Check if user is superadmin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Check if user is operator
     */
    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }

    /**
     * Check if user is admin pusat
     */
    public function isAdminPusat(): bool
    {
        return $this->role === 'adminpusat';
    }

    /**
     * Check if user can impersonate
     */
    public function canImpersonate(): bool
    {
        return $this->isSuperAdmin();
    }

    /**
     * Check if user can be impersonated
     */
    public function canBeImpersonated(): bool
    {
        return !$this->isSuperAdmin();
    }
}
