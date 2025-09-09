# Laravel Backend Implementation Guide - Kanwil Kemenag NTB
## Sistem Manajemen Pensiun

Dokumentasi lengkap untuk implementasi backend Laravel Sistem Manajemen Pensiun Kanwil Kemenag NTB yang kompatibel dengan frontend React yang sudah ada.

## 🏛️ Role Management System Overview

Sistem mengimplementasikan 3-tier role-based access control untuk Kanwil Kementerian Agama NTB:

### **1. SuperAdmin (Kanwil NTB)**
- **Akses**: Full access ke semua data dan operasi di seluruh wilayah NTB
- **Otoritas**: Approve/reject semua pengajuan pensiun, manage users, view statistics
- **Scope**: Seluruh kabupaten/kota di NTB

### **2. Operator (Kabupaten/Kota)**
- **Akses**: Terbatas pada wilayah kabupaten/kota mereka
- **Otoritas**: Create dan update pengajuan pensiun untuk pegawai di wilayahnya
- **Scope**: Regional (per kabupaten/kota)

### **3. Admin Pusat**
- **Akses**: Read-only ke semua data pensiun
- **Otoritas**: Monitoring dan reporting untuk persiapan SK (Surat Keputusan)
- **Scope**: View-only nasional

> **📌 Catatan Penting**: Pegawai (employees) tidak memiliki akses langsung ke sistem. Semua pengajuan pensiun disubmit melalui akun Operator di kabupaten/kota masing-masing.

## 📋 Daftar Isi
1. [Database Schema & Migration](#database-schema--migration)
2. [Regional Data NTB](#regional-data-ntb)
3. [API Endpoints Structure](#api-endpoints-structure)
4. [Laravel Implementation Details](#laravel-implementation-details)
5. [Role-Based Authorization](#role-based-authorization)
6. [Security Implementation](#security-implementation)
7. [Database Seeders](#database-seeders)
8. [Integration Guidelines](#integration-guidelines)
9. [Deployment & Configuration](#deployment--configuration)

---

## 1. Database Schema & Migration

### Tabel Regions (Kabupaten/Kota NTB)
```sql
CREATE TABLE regions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    kode VARCHAR(10) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    jenis ENUM('kabupaten', 'kota') NOT NULL,
    kepala_daerah VARCHAR(255),
    alamat TEXT,
    kode_pos VARCHAR(10),
    telepon VARCHAR(20),
    status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabel Users (System Users - Bukan Pegawai)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nip VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('operator', 'superadmin', 'adminpusat') NOT NULL,
    region_id BIGINT NULL, -- NULL untuk superadmin dan adminpusat
    jabatan VARCHAR(255),
    status_user ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);
```

### Tabel Employees (Data Pegawai - Bukan User System)
```sql
CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nip VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    region_id BIGINT NOT NULL,
    jabatan VARCHAR(255),
    unit_kerja VARCHAR(255),
    pangkat_golongan VARCHAR(50),
    tanggal_lahir DATE,
    tanggal_mulai_kerja DATE,
    masa_kerja_tahun INT DEFAULT 0,
    masa_kerja_bulan INT DEFAULT 0,
    gaji_pokok DECIMAL(15,2),
    status_pegawai ENUM('aktif', 'pensiun', 'pindah') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT
);
```

### Tabel Pension Applications (Pengajuan Pensiun)
```sql
CREATE TABLE pension_applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL, -- Reference ke tabel employees
    submitted_by BIGINT NOT NULL, -- User yang submit (operator)
    jenis_pensiun ENUM('normal', 'dipercepat', 'janda_duda', 'cacat') NOT NULL,
    tanggal_pengajuan DATE NOT NULL,
    tanggal_pensiun_diharapkan DATE,
    status ENUM('draft', 'diajukan', 'diterima', 'ditolak') DEFAULT 'draft',
    catatan_penolakan TEXT,
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### Tabel Documents (Dokumen Upload)
```sql
CREATE TABLE documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pension_application_id BIGINT NOT NULL,
    nama_dokumen VARCHAR(255) NOT NULL,
    kategori ENUM('identitas', 'pekerjaan', 'kesehatan', 'lainnya') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_compliant BOOLEAN DEFAULT FALSE,
    catatan_review TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pension_application_id) REFERENCES pension_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### Tabel Application Status History (Riwayat Status)
```sql
CREATE TABLE application_status_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pension_application_id BIGINT NOT NULL,
    status_lama ENUM('draft', 'diajukan', 'diterima', 'ditolak'),
    status_baru ENUM('draft', 'diajukan', 'diterima', 'ditolak') NOT NULL,
    catatan TEXT,
    changed_by BIGINT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pension_application_id) REFERENCES pension_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);
```

**Migration Laravel:**
```php
// database/migrations/2024_01_01_000000_create_regions_table.php
public function up()
{
    Schema::create('regions', function (Blueprint $table) {
        $table->id();
        $table->string('kode', 10)->unique();
        $table->string('nama');
        $table->enum('jenis', ['kabupaten', 'kota']);
        $table->string('kepala_daerah')->nullable();
        $table->text('alamat')->nullable();
        $table->string('kode_pos', 10)->nullable();
        $table->string('telepon', 20)->nullable();
        $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
        $table->timestamps();
    });
}

// database/migrations/2024_01_02_000000_create_users_table.php
public function up()
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('nip', 50)->unique();
        $table->string('nama');
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->enum('role', ['operator', 'superadmin', 'adminpusat']);
        $table->foreignId('region_id')->nullable()->constrained('regions')->onDelete('set null');
        $table->string('jabatan')->nullable();
        $table->enum('status_user', ['aktif', 'nonaktif'])->default('aktif');
        $table->timestamp('last_login')->nullable();
        $table->rememberToken();
        $table->timestamps();
        
        $table->index(['role', 'region_id']);
    });
}

// database/migrations/2024_01_03_000000_create_employees_table.php
public function up()
{
    Schema::create('employees', function (Blueprint $table) {
        $table->id();
        $table->string('nip', 50)->unique();
        $table->string('nama');
        $table->string('email')->nullable();
        $table->foreignId('region_id')->constrained('regions')->onDelete('restrict');
        $table->string('jabatan')->nullable();
        $table->string('unit_kerja')->nullable();
        $table->string('pangkat_golongan', 50)->nullable();
        $table->date('tanggal_lahir')->nullable();
        $table->date('tanggal_mulai_kerja')->nullable();
        $table->integer('masa_kerja_tahun')->default(0);
        $table->integer('masa_kerja_bulan')->default(0);
        $table->decimal('gaji_pokok', 15, 2)->nullable();
        $table->enum('status_pegawai', ['aktif', 'pensiun', 'pindah'])->default('aktif');
        $table->timestamps();
        
        $table->index(['region_id', 'status_pegawai']);
        $table->index(['nip']);
    });
}

// database/migrations/2024_01_04_000000_create_pension_applications_table.php
public function up()
{
    Schema::create('pension_applications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
        $table->foreignId('submitted_by')->constrained('users')->onDelete('restrict');
        $table->enum('jenis_pensiun', ['normal', 'dipercepat', 'janda_duda', 'cacat']);
        $table->date('tanggal_pengajuan');
        $table->date('tanggal_pensiun_diharapkan')->nullable();
        $table->enum('status', ['draft', 'diajukan', 'diterima', 'ditolak'])->default('draft');
        $table->text('catatan_penolakan')->nullable();
        $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
        $table->timestamp('approved_at')->nullable();
        $table->timestamps();
        
        $table->index(['employee_id', 'status']);
        $table->index(['submitted_by', 'status']);
        $table->index(['tanggal_pengajuan']);
    });
}
```

---

## 2. Regional Data NTB

### Data Kabupaten/Kota di Nusa Tenggara Barat
```php
// database/seeders/RegionSeeder.php
public function run()
{
    $regions = [
        ['kode' => '5201', 'nama' => 'Kabupaten Lombok Barat', 'jenis' => 'kabupaten'],
        ['kode' => '5202', 'nama' => 'Kabupaten Lombok Tengah', 'jenis' => 'kabupaten'],
        ['kode' => '5203', 'nama' => 'Kabupaten Lombok Timur', 'jenis' => 'kabupaten'],
        ['kode' => '5204', 'nama' => 'Kabupaten Sumbawa', 'jenis' => 'kabupaten'],
        ['kode' => '5205', 'nama' => 'Kabupaten Dompu', 'jenis' => 'kabupaten'],
        ['kode' => '5206', 'nama' => 'Kabupaten Bima', 'jenis' => 'kabupaten'],
        ['kode' => '5207', 'nama' => 'Kabupaten Sumbawa Barat', 'jenis' => 'kabupaten'],
        ['kode' => '5208', 'nama' => 'Kabupaten Lombok Utara', 'jenis' => 'kabupaten'],
        ['kode' => '5271', 'nama' => 'Kota Mataram', 'jenis' => 'kota'],
        ['kode' => '5272', 'nama' => 'Kota Bima', 'jenis' => 'kota'],
    ];

    foreach ($regions as $region) {
        Region::create([
            'kode' => $region['kode'],
            'nama' => $region['nama'],
            'jenis' => $region['jenis'],
            'status' => 'aktif'
        ]);
    }
}
```

---

## 3. API Endpoints Structure

### Authentication Endpoints
```php
POST   /api/auth/login           // Login user system
POST   /api/auth/logout          // Logout
GET    /api/auth/user            // Get current user info
POST   /api/auth/refresh         // Refresh token
```

### Regional Data Endpoints
```php
GET    /api/regions              // List kabupaten/kota (all users)
GET    /api/regions/{id}         // Get specific region
```

### Employee Management Endpoints
```php
GET    /api/employees            // List employees (filtered by role/region)
POST   /api/employees           // Create employee (operator only for their region)
GET    /api/employees/{id}       // Get specific employee
PUT    /api/employees/{id}       // Update employee data
DELETE /api/employees/{id}       // Soft delete employee
GET    /api/employees/search     // Search employees
```

### Pension Applications Endpoints
```php
GET    /api/pension-applications           // List applications (filtered by role/region)
POST   /api/pension-applications          // Create new application (operator only)
GET    /api/pension-applications/{id}     // Get specific application
PUT    /api/pension-applications/{id}     // Update application (operator only)
DELETE /api/pension-applications/{id}     // Delete draft application
PUT    /api/pension-applications/{id}/status  // Update status (superadmin only)
GET    /api/pension-applications/{id}/history // Get status history
```

### Document Management Endpoints
```php
POST   /api/pension-applications/{id}/documents     // Upload document
GET    /api/pension-applications/{id}/documents     // List application documents
GET    /api/documents/{id}                          // Get document details
GET    /api/documents/{id}/download                 // Download document
GET    /api/documents/{id}/preview                  // Preview document
PUT    /api/documents/{id}/compliance               // Update compliance status
DELETE /api/documents/{id}                          // Delete document
```

### Dashboard & Statistics Endpoints
```php
GET    /api/dashboard/stats      // Dashboard statistics (filtered by role)
GET    /api/dashboard/summary    // Application summary by status
GET    /api/dashboard/recent     // Recent activities
GET    /api/dashboard/regional   // Regional statistics (superadmin only)
```

### User Management Endpoints (SuperAdmin Only)
```php
GET    /api/users               // List system users
POST   /api/users               // Create new user
PUT    /api/users/{id}          // Update user
DELETE /api/users/{id}          // Deactivate user
```

---

## 4. Laravel Implementation Details

### Models dengan Regional Relationships

**Region Model:**
```php
// app/Models/Region.php
class Region extends Model
{
    protected $fillable = [
        'kode', 'nama', 'jenis', 'kepala_daerah', 
        'alamat', 'kode_pos', 'telepon', 'status'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function pensionApplications()
    {
        return $this->hasManyThrough(PensionApplication::class, Employee::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'aktif');
    }
}
```

**User Model (Updated):**
```php
// app/Models/User.php
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nip', 'nama', 'email', 'password', 'role', 
        'region_id', 'jabatan', 'status_user', 'last_login'
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login' => 'datetime',
        'password' => 'hashed',
    ];

    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    public function submittedApplications()
    {
        return $this->hasMany(PensionApplication::class, 'submitted_by');
    }

    public function approvedApplications()
    {
        return $this->hasMany(PensionApplication::class, 'approved_by');
    }

    public function reviewedDocuments()
    {
        return $this->hasMany(Document::class, 'reviewed_by');
    }

    // Check if user can access specific region
    public function canAccessRegion($regionId)
    {
        return $this->role === 'superadmin' || 
               $this->role === 'adminpusat' || 
               $this->region_id == $regionId;
    }

    // Check if user can perform operations
    public function canCreateApplication()
    {
        return $this->role === 'operator';
    }

    public function canApproveApplication()
    {
        return $this->role === 'superadmin';
    }
}
```

**Employee Model:**
```php
// app/Models/Employee.php
class Employee extends Model
{
    protected $fillable = [
        'nip', 'nama', 'email', 'region_id', 'jabatan', 
        'unit_kerja', 'pangkat_golongan', 'tanggal_lahir', 
        'tanggal_mulai_kerja', 'masa_kerja_tahun', 'masa_kerja_bulan',
        'gaji_pokok', 'status_pegawai'
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'tanggal_mulai_kerja' => 'date',
        'gaji_pokok' => 'decimal:2',
    ];

    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    public function pensionApplications()
    {
        return $this->hasMany(PensionApplication::class);
    }

    public function scopeByRegion($query, $regionId)
    {
        return $query->where('region_id', $regionId);
    }

    public function scopeActive($query)
    {
        return $query->where('status_pegawai', 'aktif');
    }

    // Calculate retirement age
    public function getRetirementAgeAttribute()
    {
        if (!$this->tanggal_lahir) return null;
        
        $retirementDate = $this->tanggal_lahir->addYears(58);
        return $retirementDate;
    }
}
```

**PensionApplication Model (Updated):**
```php
// app/Models/PensionApplication.php
class PensionApplication extends Model
{
    protected $fillable = [
        'employee_id', 'submitted_by', 'jenis_pensiun', 'tanggal_pengajuan', 
        'tanggal_pensiun_diharapkan', 'status', 'catatan_penolakan',
        'approved_by', 'approved_at'
    ];

    protected $casts = [
        'tanggal_pengajuan' => 'date',
        'tanggal_pensiun_diharapkan' => 'date',
        'approved_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(ApplicationStatusHistory::class);
    }

    // Scope for regional filtering
    public function scopeByRegion($query, $regionId)
    {
        return $query->whereHas('employee', function ($q) use ($regionId) {
            $q->where('region_id', $regionId);
        });
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Check if all documents are compliant
    public function allDocumentsCompliant()
    {
        return $this->documents()->where('is_compliant', false)->count() === 0;
    }
}
```

### Controllers dengan Regional Access Control

**PensionApplicationController (Updated):**
```php
// app/Http/Controllers/Api/PensionApplicationController.php
class PensionApplicationController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = PensionApplication::with(['employee.region', 'submitter', 'documents']);
        
        // Filter berdasarkan role dan region
        switch ($user->role) {
            case 'operator':
                $query->byRegion($user->region_id);
                break;
            case 'superadmin':
                // Can see all applications
                break;
            case 'adminpusat':
                // Can see all applications (read-only)
                break;
        }
        
        // Additional filters
        if ($request->has('status')) {
            $query->byStatus($request->status);
        }
        
        if ($request->has('region_id') && $user->role === 'superadmin') {
            $query->byRegion($request->region_id);
        }
        
        if ($request->has('jenis_pensiun')) {
            $query->where('jenis_pensiun', $request->jenis_pensiun);
        }
        
        // Search by employee name or NIP
        if ($request->has('search')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('nama', 'like', '%' . $request->search . '%')
                  ->orWhere('nip', 'like', '%' . $request->search . '%');
            });
        }
        
        return response()->json($query->paginate(15));
    }

    public function store(StoreApplicationRequest $request)
    {
        $user = auth()->user();
        
        // Only operators can create applications
        if ($user->role !== 'operator') {
            abort(403, 'Only operators can submit pension applications');
        }

        // Verify employee belongs to operator's region
        $employee = Employee::findOrFail($request->employee_id);
        if ($employee->region_id !== $user->region_id) {
            abort(403, 'Employee not in your region');
        }

        $application = PensionApplication::create([
            'employee_id' => $request->employee_id,
            'submitted_by' => $user->id,
            'jenis_pensiun' => $request->jenis_pensiun,
            'tanggal_pengajuan' => $request->tanggal_pengajuan,
            'tanggal_pensiun_diharapkan' => $request->tanggal_pensiun_diharapkan,
            'status' => 'draft'
        ]);

        // Create status history
        ApplicationStatusHistory::create([
            'pension_application_id' => $application->id,
            'status_baru' => 'draft',
            'catatan' => 'Pengajuan dibuat oleh ' . $user->nama,
            'changed_by' => $user->id
        ]);

        return response()->json($application->load('employee', 'submitter'), 201);
    }

    public function updateStatus(UpdateStatusRequest $request, $id)
    {
        $user = auth()->user();
        $application = PensionApplication::findOrFail($id);
        
        // Only superadmin can update status
        if ($user->role !== 'superadmin') {
            abort(403, 'Only superadmin can update application status');
        }
        
        $oldStatus = $application->status;
        
        $application->update([
            'status' => $request->status,
            'catatan_penolakan' => $request->catatan_penolakan,
            'approved_by' => $request->status === 'diterima' ? $user->id : null,
            'approved_at' => $request->status === 'diterima' ? now() : null,
        ]);
        
        // Create status history
        ApplicationStatusHistory::create([
            'pension_application_id' => $application->id,
            'status_lama' => $oldStatus,
            'status_baru' => $request->status,
            'catatan' => $request->catatan ?? "Status diubah ke {$request->status} oleh {$user->nama}",
            'changed_by' => $user->id
        ]);
        
        return response()->json($application->load('employee', 'submitter', 'approver'));
    }
}
```

**EmployeeController:**
```php
// app/Http/Controllers/Api/EmployeeController.php
class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Employee::with('region');
        
        // Filter by region based on role
        switch ($user->role) {
            case 'operator':
                $query->byRegion($user->region_id);
                break;
            case 'superadmin':
            case 'adminpusat':
                // Can see all employees
                if ($request->has('region_id')) {
                    $query->byRegion($request->region_id);
                }
                break;
        }
        
        // Additional filters
        if ($request->has('status_pegawai')) {
            $query->where('status_pegawai', $request->status_pegawai);
        }
        
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama', 'like', '%' . $request->search . '%')
                  ->orWhere('nip', 'like', '%' . $request->search . '%');
            });
        }
        
        return response()->json($query->paginate(15));
    }

    public function store(StoreEmployeeRequest $request)
    {
        $user = auth()->user();
        
        // Only operators can create employees
        if ($user->role !== 'operator') {
            abort(403, 'Only operators can create employees');
        }

        $employee = Employee::create([
            'nip' => $request->nip,
            'nama' => $request->nama,
            'email' => $request->email,
            'region_id' => $user->region_id, // Force to operator's region
            'jabatan' => $request->jabatan,
            'unit_kerja' => $request->unit_kerja,
            'pangkat_golongan' => $request->pangkat_golongan,
            'tanggal_lahir' => $request->tanggal_lahir,
            'tanggal_mulai_kerja' => $request->tanggal_mulai_kerja,
            'masa_kerja_tahun' => $request->masa_kerja_tahun,
            'masa_kerja_bulan' => $request->masa_kerja_bulan,
            'gaji_pokok' => $request->gaji_pokok,
        ]);

        return response()->json($employee->load('region'), 201);
    }
}
```

---

## 5. Role-Based Authorization

### Regional Middleware
```php
// app/Http/Middleware/RegionalAccessMiddleware.php
class RegionalAccessMiddleware
{
    public function handle($request, Closure $next, ...$roles)
    {
        $user = auth()->user();
        
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Check role authorization
        if (!in_array($user->role, $roles)) {
            abort(403, 'Insufficient privileges');
        }

        // Regional access check for operators
        if ($user->role === 'operator') {
            $regionId = $request->route('region_id') ?? $request->input('region_id');
            
            if ($regionId && !$user->canAccessRegion($regionId)) {
                abort(403, 'Access denied to this region');
            }
        }

        return $next($request);
    }
}
```

### Policy Classes
```php
// app/Policies/PensionApplicationPolicy.php
class PensionApplicationPolicy
{
    public function view(User $user, PensionApplication $application)
    {
        switch ($user->role) {
            case 'operator':
                return $application->employee->region_id === $user->region_id;
            case 'superadmin':
            case 'adminpusat':
                return true;
            default:
                return false;
        }
    }

    public function create(User $user)
    {
        return $user->role === 'operator';
    }

    public function update(User $user, PensionApplication $application)
    {
        if ($user->role === 'operator') {
            return $application->employee->region_id === $user->region_id &&
                   in_array($application->status, ['draft', 'diajukan']);
        }
        
        return false;
    }

    public function updateStatus(User $user, PensionApplication $application)
    {
        return $user->role === 'superadmin';
    }
}

// app/Policies/EmployeePolicy.php
class EmployeePolicy
{
    public function view(User $user, Employee $employee)
    {
        return $user->canAccessRegion($employee->region_id);
    }

    public function create(User $user)
    {
        return $user->role === 'operator';
    }

    public function update(User $user, Employee $employee)
    {
        return $user->role === 'operator' && 
               $user->region_id === $employee->region_id;
    }
}
```

### Route Protection
```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Operator routes
    Route::middleware(['regional_access:operator'])->group(function () {
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::post('/pension-applications', [PensionApplicationController::class, 'store']);
        Route::put('/pension-applications/{id}', [PensionApplicationController::class, 'update']);
    });
    
    // SuperAdmin routes
    Route::middleware(['regional_access:superadmin'])->group(function () {
        Route::put('/pension-applications/{id}/status', [PensionApplicationController::class, 'updateStatus']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/dashboard/regional', [DashboardController::class, 'regionalStats']);
    });
    
    // Admin Pusat routes (read-only)
    Route::middleware(['regional_access:adminpusat'])->group(function () {
        Route::get('/monitoring/applications', [MonitoringController::class, 'applications']);
        Route::get('/reports/pension-summary', [ReportController::class, 'pensionSummary']);
    });
    
    // Common routes (all roles with regional filtering)
    Route::middleware(['regional_access:operator,superadmin,adminpusat'])->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::get('/pension-applications', [PensionApplicationController::class, 'index']);
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    });
});
```

---

## 6. Security Implementation

### Audit Trail System
```php
// app/Models/AuditLog.php
class AuditLog extends Model
{
    protected $fillable = [
        'user_id', 'action', 'model_type', 'model_id', 
        'old_values', 'new_values', 'ip_address', 'user_agent'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

// app/Traits/Auditable.php
trait Auditable
{
    protected static function bootAuditable()
    {
        static::created(function ($model) {
            $model->auditAction('created');
        });

        static::updated(function ($model) {
            $model->auditAction('updated');
        });

        static::deleted(function ($model) {
            $model->auditAction('deleted');
        });
    }

    protected function auditAction($action)
    {
        if (auth()->check()) {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => $action,
                'model_type' => get_class($this),
                'model_id' => $this->id,
                'old_values' => $this->getOriginal(),
                'new_values' => $this->getAttributes(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }
    }
}
```

### Rate Limiting per Role
```php
// app/Http/Middleware/RoleBasedRateLimit.php
class RoleBasedRateLimit
{
    public function handle($request, Closure $next)
    {
        $user = auth()->user();
        
        if (!$user) {
            return $next($request);
        }

        $limits = [
            'operator' => '100,1', // 100 requests per minute
            'superadmin' => '200,1', // 200 requests per minute
            'adminpusat' => '50,1', // 50 requests per minute (read-only)
        ];

        $limit = $limits[$user->role] ?? '60,1';
        
        return app(RateLimiter::class)->attempt(
            'user:' . $user->id,
            $limit,
            function () use ($next, $request) {
                return $next($request);
            }
        );
    }
}
```

---

## 7. Database Seeders

### Regional Data Seeder
```php
// database/seeders/RegionSeeder.php
class RegionSeeder extends Seeder
{
    public function run()
    {
        $regions = [
            [
                'kode' => '5201',
                'nama' => 'Kabupaten Lombok Barat',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Fauzan Khalid',
                'alamat' => 'Jl. Raya Gerung No.1, Gerung, Lombok Barat',
                'kode_pos' => '83511',
                'telepon' => '0370-681239'
            ],
            [
                'kode' => '5202',
                'nama' => 'Kabupaten Lombok Tengah',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Lalu Pathul Bahri',
                'alamat' => 'Jl. Selaparang No.1, Praya, Lombok Tengah',
                'kode_pos' => '83511',
                'telepon' => '0370-654321'
            ],
            [
                'kode' => '5203',
                'nama' => 'Kabupaten Lombok Timur',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Sukiman Azmy',
                'alamat' => 'Jl. TGH. Lopan No.1, Selong, Lombok Timur',
                'kode_pos' => '83611',
                'telepon' => '0376-621293'
            ],
            [
                'kode' => '5204',
                'nama' => 'Kabupaten Sumbawa',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Mahmud Abdullah',
                'alamat' => 'Jl. Dr. Sutomo No.1, Sumbawa Besar',
                'kode_pos' => '84311',
                'telepon' => '0371-621293'
            ],
            [
                'kode' => '5205',
                'nama' => 'Kabupaten Dompu',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Bambang M. Yasin',
                'alamat' => 'Jl. Lintas Sumbawa-Bima, Dompu',
                'kode_pos' => '84511',
                'telepon' => '0373-21293'
            ],
            [
                'kode' => '5206',
                'nama' => 'Kabupaten Bima',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Indra Yacob',
                'alamat' => 'Jl. Sultan Hasanuddin No.1, Woha, Bima',
                'kode_pos' => '84171',
                'telepon' => '0374-42293'
            ],
            [
                'kode' => '5207',
                'nama' => 'Kabupaten Sumbawa Barat',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Zulkarnain',
                'alamat' => 'Jl. Datuk Dibanta, Taliwang, Sumbawa Barat',
                'kode_pos' => '84411',
                'telepon' => '0372-81293'
            ],
            [
                'kode' => '5208',
                'nama' => 'Kabupaten Lombok Utara',
                'jenis' => 'kabupaten',
                'kepala_daerah' => 'H. Najmul Akhyar',
                'alamat' => 'Jl. Raya Tanjung-Senggigi, Tanjung, Lombok Utara',
                'kode_pos' => '83352',
                'telepon' => '0370-633293'
            ],
            [
                'kode' => '5271',
                'nama' => 'Kota Mataram',
                'jenis' => 'kota',
                'kepala_daerah' => 'H. Mohan Roliskana',
                'alamat' => 'Jl. Pejanggik No.6, Mataram',
                'kode_pos' => '83125',
                'telepon' => '0370-631293'
            ],
            [
                'kode' => '5272',
                'nama' => 'Kota Bima',
                'jenis' => 'kota',
                'kepala_daerah' => 'Hj. Indah Dhamayanti Putri',
                'alamat' => 'Jl. Sultan Ibrahim No.1, Bima',
                'kode_pos' => '84118',
                'telepon' => '0374-43293'
            ]
        ];

        foreach ($regions as $region) {
            Region::create($region);
        }
    }
}
```

### User System Seeder
```php
// database/seeders/UserSeeder.php
class UserSeeder extends Seeder
{
    public function run()
    {
        // SuperAdmin Kanwil NTB
        User::create([
            'nip' => 'SA001NTB',
            'nama' => 'Drs. H. Muhammad Mahfud',
            'email' => 'kanwil.ntb@kemenag.go.id',
            'password' => Hash::make('kanwilntb2024'),
            'role' => 'superadmin',
            'region_id' => null,
            'jabatan' => 'Kepala Kantor Wilayah Kemenag NTB',
            'status_user' => 'aktif'
        ]);

        // Admin Pusat
        User::create([
            'nip' => 'AP001',
            'nama' => 'Dr. Hj. Siti Aisyah, M.Pd',
            'email' => 'adminpusat@kemenag.go.id',
            'password' => Hash::make('adminpusat2024'),
            'role' => 'adminpusat',
            'region_id' => null,
            'jabatan' => 'Kepala Bidang Monitoring Pensiun',
            'status_user' => 'aktif'
        ]);

        // Operator untuk setiap kabupaten/kota
        $regions = Region::all();
        
        foreach ($regions as $region) {
            User::create([
                'nip' => 'OP' . str_pad($region->id, 3, '0', STR_PAD_LEFT),
                'nama' => 'Operator ' . $region->nama,
                'email' => 'operator.' . Str::slug($region->nama) . '@kemenag.go.id',
                'password' => Hash::make('operator2024'),
                'role' => 'operator',
                'region_id' => $region->id,
                'jabatan' => 'Operator Sistem Pensiun ' . $region->nama,
                'status_user' => 'aktif'
            ]);
        }
    }
}
```

### Employee Sample Seeder
```php
// database/seeders/EmployeeSeeder.php
class EmployeeSeeder extends Seeder
{
    public function run()
    {
        $regions = Region::all();
        
        foreach ($regions as $region) {
            // Create 20-30 sample employees per region
            for ($i = 1; $i <= rand(20, 30); $i++) {
                Employee::create([
                    'nip' => $region->kode . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'nama' => $this->generateName(),
                    'email' => $this->generateEmail($region->kode, $i),
                    'region_id' => $region->id,
                    'jabatan' => $this->randomJabatan(),
                    'unit_kerja' => $this->randomUnitKerja($region->nama),
                    'pangkat_golongan' => $this->randomPangkat(),
                    'tanggal_lahir' => $this->randomBirthDate(),
                    'tanggal_mulai_kerja' => $this->randomStartWorkDate(),
                    'masa_kerja_tahun' => rand(5, 35),
                    'masa_kerja_bulan' => rand(0, 11),
                    'gaji_pokok' => rand(3000000, 8000000),
                    'status_pegawai' => 'aktif'
                ]);
            }
        }
    }

    private function generateName()
    {
        $firstNames = ['Ahmad', 'Muhammad', 'Siti', 'Fatimah', 'Abdul', 'Khadijah', 'Ali', 'Aisyah', 'Umar', 'Zainab'];
        $lastNames = ['Rahman', 'Hidayat', 'Wijaya', 'Sari', 'Pratama', 'Lestari', 'Santoso', 'Rahayu', 'Putra', 'Dewi'];
        
        return $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
    }

    private function generateEmail($regionCode, $number)
    {
        return 'pegawai.' . $regionCode . '.' . str_pad($number, 3, '0', STR_PAD_LEFT) . '@kemenag.go.id';
    }

    private function randomJabatan()
    {
        $jabatan = [
            'Guru PAI', 'Guru Bahasa Arab', 'Penyuluh Agama', 'Penghulu', 
            'Administrator', 'Bendahara', 'Staf Administrasi', 'Kepala Seksi',
            'Kepala KUA', 'Pengawas PAI', 'Kepala MAN', 'Kepala MIN'
        ];
        
        return $jabatan[array_rand($jabatan)];
    }

    private function randomUnitKerja($regionName)
    {
        $units = [
            'Kankemenag ' . $regionName,
            'KUA Kecamatan',
            'MAN ' . $regionName,
            'MIN ' . $regionName,
            'Ponpes Darul Hijrah',
            'Seksi Pendidikan Madrasah'
        ];
        
        return $units[array_rand($units)];
    }

    private function randomPangkat()
    {
        $pangkat = [
            'II/a - Pengatur Muda',
            'II/b - Pengatur Muda Tingkat I',
            'II/c - Pengatur',
            'II/d - Pengatur Tingkat I',
            'III/a - Penata Muda',
            'III/b - Penata Muda Tingkat I',
            'III/c - Penata',
            'III/d - Penata Tingkat I',
            'IV/a - Pembina',
            'IV/b - Pembina Tingkat I'
        ];
        
        return $pangkat[array_rand($pangkat)];
    }

    private function randomBirthDate()
    {
        return Carbon::now()->subYears(rand(35, 58))->subMonths(rand(1, 12))->format('Y-m-d');
    }

    private function randomStartWorkDate()
    {
        return Carbon::now()->subYears(rand(5, 35))->subMonths(rand(1, 12))->format('Y-m-d');
    }
}
```

---

## 8. Integration Guidelines

### Authentication Flow dengan Role Detection
```javascript
// Frontend integration example
const authService = {
    async login(credentials) {
        const response = await api.post('/auth/login', credentials);
        const { user, token } = response.data.data;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_role', user.role);
        localStorage.setItem('user_region', user.region_id);
        
        return { user, token };
    },

    async getCurrentUser() {
        const response = await api.get('/auth/user');
        return response.data.data;
    },

    getUserRole() {
        return localStorage.getItem('user_role');
    },

    getUserRegion() {
        return localStorage.getItem('user_region');
    },

    canCreateApplication() {
        return this.getUserRole() === 'operator';
    },

    canApproveApplication() {
        return this.getUserRole() === 'superadmin';
    },

    isReadOnly() {
        return this.getUserRole() === 'adminpusat';
    }
};
```

### Regional Data Filtering
```javascript
// Frontend service for regional filtering
const regionService = {
    async getApplications(filters = {}) {
        const userRole = authService.getUserRole();
        const userRegion = authService.getUserRegion();
        
        // Auto-apply regional filter for operators
        if (userRole === 'operator' && userRegion) {
            filters.region_id = userRegion;
        }
        
        const response = await api.get('/pension-applications', { params: filters });
        return response.data;
    },

    async getEmployees(filters = {}) {
        const userRole = authService.getUserRole();
        const userRegion = authService.getUserRegion();
        
        if (userRole === 'operator' && userRegion) {
            filters.region_id = userRegion;
        }
        
        const response = await api.get('/employees', { params: filters });
        return response.data;
    },

    async getRegions() {
        const response = await api.get('/regions');
        return response.data.data;
    }
};
```

### Dynamic UI Components
```javascript
// React component example with role-based rendering
const ApplicationList = () => {
    const userRole = authService.getUserRole();
    const userRegion = authService.getUserRegion();
    const [applications, setApplications] = useState([]);
    const [regions, setRegions] = useState([]);

    useEffect(() => {
        loadApplications();
        if (userRole === 'superadmin') {
            loadRegions();
        }
    }, []);

    const renderActionButtons = (application) => {
        switch (userRole) {
            case 'operator':
                return (
                    <>
                        {application.status === 'draft' && (
                            <Button onClick={() => submitApplication(application.id)}>
                                Submit
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => editApplication(application.id)}>
                            Edit
                        </Button>
                    </>
                );
            case 'superadmin':
                return (
                    <>
                        {application.status === 'diajukan' && (
                            <>
                                <Button onClick={() => approveApplication(application.id)}>
                                    Approve
                                </Button>
                                <Button variant="destructive" onClick={() => rejectApplication(application.id)}>
                                    Reject
                                </Button>
                            </>
                        )}
                    </>
                );
            case 'adminpusat':
                return (
                    <Button variant="outline" onClick={() => viewApplication(application.id)}>
                        View Details
                    </Button>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            {userRole === 'superadmin' && (
                <RegionFilter 
                    regions={regions} 
                    onRegionChange={handleRegionFilter} 
                />
            )}
            
            <ApplicationTable 
                applications={applications}
                renderActions={renderActionButtons}
                showRegionColumn={userRole !== 'operator'}
            />
        </div>
    );
};
```

---

## 9. Deployment & Configuration

### Environment Configuration untuk NTB
```bash
# .env
APP_NAME="Sistem Manajemen Pensiun Kanwil Kemenag NTB"
APP_ENV=production
APP_KEY=base64:your-app-key
APP_DEBUG=false
APP_URL=https://pensiun.ntb.kemenag.go.id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pension_kanwil_ntb
DB_USERNAME=pension_user
DB_PASSWORD=your_secure_password

# Regional Configuration
DEFAULT_REGION=NTB
KANWIL_NAME="Kantor Wilayah Kementerian Agama NTB"
KANWIL_CODE=5200

# Security
SESSION_LIFETIME=120
SESSION_DOMAIN=.ntb.kemenag.go.id
SANCTUM_STATEFUL_DOMAINS=pensiun.ntb.kemenag.go.id

# File Upload
UPLOAD_MAX_FILESIZE=20M
POST_MAX_SIZE=20M
MAX_DOCUMENTS_PER_APPLICATION=10

# Mail Configuration for Notifications
MAIL_MAILER=smtp
MAIL_HOST=smtp.kemenag.go.id
MAIL_PORT=587
MAIL_USERNAME=noreply@ntb.kemenag.go.id
MAIL_PASSWORD=your_mail_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@ntb.kemenag.go.id
MAIL_FROM_NAME="Sistem Pensiun Kanwil NTB"
```

### Performance Optimization untuk Regional Data
```php
// config/cache.php - Caching configuration
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',
        'lock_connection' => 'default',
    ],
    
    'regional_cache' => [
        'driver' => 'redis',
        'connection' => 'cache',
        'prefix' => 'regional:',
        'serializer' => 'php',
    ],
]

// app/Services/RegionalCacheService.php
class RegionalCacheService
{
    private $cache;

    public function __construct()
    {
        $this->cache = Cache::store('regional_cache');
    }

    public function getRegionalStats($regionId)
    {
        return $this->cache->remember("stats:region:{$regionId}", 3600, function () use ($regionId) {
            return [
                'total_employees' => Employee::byRegion($regionId)->count(),
                'active_applications' => PensionApplication::byRegion($regionId)
                    ->whereIn('status', ['draft', 'diajukan'])->count(),
                'approved_applications' => PensionApplication::byRegion($regionId)
                    ->where('status', 'diterima')->count(),
            ];
        });
    }

    public function clearRegionalCache($regionId)
    {
        $this->cache->forget("stats:region:{$regionId}");
    }
}
```

---

## 🚀 Quick Start Commands

```bash
# Setup project untuk Kanwil Kemenag NTB
git clone <repository-url>
cd pension-kanwil-ntb-backend
composer install

# Environment setup
cp .env.example .env
php artisan key:generate
# Edit .env file dengan konfigurasi NTB

# Database setup dengan data NTB
php artisan migrate
php artisan db:seed --class=RegionSeeder
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=EmployeeSeeder

# Storage dan permissions
php artisan storage:link
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Cache optimization
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Queue worker untuk production
php artisan queue:work --daemon --tries=3

# Development server
php artisan serve --host=0.0.0.0 --port=8000
```

---

## 📊 Monitoring & Analytics

### Regional Performance Monitoring
```php
// app/Http/Controllers/Api/MonitoringController.php
class MonitoringController extends Controller
{
    public function regionalSummary()
    {
        $user = auth()->user();
        
        if ($user->role !== 'superadmin' && $user->role !== 'adminpusat') {
            abort(403);
        }

        $summary = Region::with(['employees', 'pensionApplications'])
            ->get()
            ->map(function ($region) {
                return [
                    'region' => $region->nama,
                    'total_employees' => $region->employees->count(),
                    'total_applications' => $region->pensionApplications->count(),
                    'pending_applications' => $region->pensionApplications
                        ->whereIn('status', ['draft', 'diajukan'])->count(),
                    'approved_applications' => $region->pensionApplications
                        ->where('status', 'diterima')->count(),
                    'completion_rate' => $this->calculateCompletionRate($region),
                ];
            });

        return response()->json($summary);
    }

    private function calculateCompletionRate($region)
    {
        $total = $region->pensionApplications->count();
        $completed = $region->pensionApplications
            ->whereIn('status', ['diterima', 'ditolak'])->count();
        
        return $total > 0 ? round(($completed / $total) * 100, 2) : 0;
    }
}
```

---

**📞 Dukungan Teknis**

Untuk implementasi sistem ini di Kanwil Kemenag NTB, pastikan:
1. **Koordinasi dengan IT Kemenag NTB** untuk server dan infrastruktur
2. **Training operator** di setiap kabupaten/kota
3. **Backup data regular** dan disaster recovery plan
4. **Monitoring keamanan** dan audit trail
5. **Update berkala** sesuai regulasi terbaru pensiun PNS

Dokumentasi ini disesuaikan dengan struktur organisasi Kanwil Kemenag NTB dan kebutuhan spesifik regional.