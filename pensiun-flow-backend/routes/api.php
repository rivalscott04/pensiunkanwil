<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\KabupatenController;
use App\Http\Controllers\Api\PengajuanController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\LetterController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (no authentication required)
Route::post('/auth/login', [AuthController::class, 'login']);

// Public sync endpoints (no auth, since source is public)
Route::post('/sync/employees', [SyncController::class, 'syncEmployees']);
Route::get('/sync/status', [SyncController::class, 'syncStatus']);
Route::get('/employees', function () {
    $perPage = (int) request()->query('per_page', request()->query('perPage', 10));
    if ($perPage <= 0) { $perPage = 10; }
    if ($perPage > 100) { $perPage = 100; }

    $q = trim((string) request()->query('q', ''));

    $query = \App\Models\Employee::query()
        ->when($q !== '', function ($qq) use ($q) {
            $qq->where(function ($w) use ($q) {
                $w->where('nip', 'like', "%{$q}%")
                  ->orWhere('nama', 'like', "%{$q}%")
                  ->orWhere('unit_kerja', 'like', "%{$q}%");
            });
        })
        ->whereYear('tmt_pensiun', date('Y'))
        ->orderBy('nama');

    return $query->paginate($perPage);
});

// (removed) public personnel search

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    // Alias to match frontend expectation
    Route::get('/auth/user', [AuthController::class, 'me']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    
    // Impersonate routes (superadmin only)
    Route::post('/auth/impersonate', [AuthController::class, 'impersonate']);
    Route::post('/auth/stop-impersonate', [AuthController::class, 'stopImpersonate']);
    
    // User management routes (superadmin only)
    Route::middleware('role:superadmin')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });
    // Profile endpoints for any authenticated user
    Route::get('/users/profile', [UserController::class, 'profile']);
    Route::put('/users/profile', [UserController::class, 'updateProfile']);
    
    // Kabupaten routes
    Route::prefix('kabupaten')->group(function () {
        Route::get('/', [KabupatenController::class, 'index']);
        Route::get('/active', [KabupatenController::class, 'active']);
        Route::get('/stats', [KabupatenController::class, 'stats']);
        Route::get('/{kabupaten}', [KabupatenController::class, 'show']);
        Route::post('/', [KabupatenController::class, 'store']);
        Route::put('/{kabupaten}', [KabupatenController::class, 'update']);
        Route::delete('/{kabupaten}', [KabupatenController::class, 'destroy']);
    });
    // Aliases to match frontend (regions)
    Route::prefix('regions')->group(function () {
        Route::get('/', [KabupatenController::class, 'index']);
        Route::get('/{kabupaten}', [KabupatenController::class, 'show']);
    });
    
    // Pengajuan routes (role-based)
    Route::prefix('pengajuan')->group(function () {
        // Read access: superadmin, adminpusat, operator
        Route::middleware('any.role:superadmin,adminpusat,operator')->group(function () {
            Route::get('/', [PengajuanController::class, 'index']);
            Route::get('/stats', [PengajuanController::class, 'stats']);
            Route::get('/{pengajuan}', [PengajuanController::class, 'show']);
        });
        // Create/Update by operator and superadmin
        Route::middleware('any.role:superadmin,operator')->group(function () {
            Route::post('/', [PengajuanController::class, 'store']);
            Route::put('/{pengajuan}', [PengajuanController::class, 'update']);
            Route::post('/{pengajuan}/submit', [PengajuanController::class, 'submit']);
        });
        // Status update & delete by superadmin only
        Route::middleware('role:superadmin')->group(function () {
            Route::put('/{pengajuan}/status', [PengajuanController::class, 'updateStatus']);
            Route::delete('/{pengajuan}', [PengajuanController::class, 'destroy']);
        });
    });
    // Aliases to match frontend (pension-applications)
    Route::prefix('pension-applications')->group(function () {
        Route::get('/', [PengajuanController::class, 'index']);
        Route::post('/', [PengajuanController::class, 'store']);
        Route::get('/{pengajuan}', [PengajuanController::class, 'show']);
        Route::put('/{pengajuan}', [PengajuanController::class, 'update']);
        Route::delete('/{pengajuan}', [PengajuanController::class, 'destroy']);
        Route::put('/{pengajuan}/status', [PengajuanController::class, 'updateStatus']);
        // documents under a pension application
        Route::get('/{pengajuan}/documents', [FileController::class, 'getFiles']);
        Route::post('/{pengajuan}/documents', [FileController::class, 'upload']);
    });
    
    // File management routes (role-based)
    Route::prefix('files')->group(function () {
        // Upload by superadmin & operator
        Route::middleware('any.role:superadmin,operator')->group(function () {
            Route::post('/upload', [FileController::class, 'upload']);
            Route::post('/bulk-upload', [FileController::class, 'bulkUpload']);
        });
        // Read/Download allowed for all roles including petugas
        Route::middleware('any.role:superadmin,adminpusat,operator,petugas')->group(function () {
            Route::get('/pengajuan/{pengajuan}', [FileController::class, 'getFiles']);
            Route::get('/{file}/preview', [FileController::class, 'preview']);
            Route::get('/{file}/download', [FileController::class, 'download'])->name('api.files.download');
        });
        // Delete by superadmin only
        Route::middleware('role:superadmin')->group(function () {
            Route::delete('/{file}', [FileController::class, 'destroy']);
        });
    });
    // Aliases to match frontend (documents)
    Route::prefix('documents')->group(function () {
        Route::get('/{file}/preview', [FileController::class, 'preview']);
        Route::get('/{file}/download', [FileController::class, 'download']);
        Route::delete('/{file}', [FileController::class, 'destroy']);
    });
    
    // Activity logs routes (superadmin only)
    Route::middleware('role:superadmin')->prefix('activity-logs')->group(function () {
        Route::get('/', function () {
            // TODO: Implement ActivityLogController
            return response()->json(['message' => 'Activity logs endpoint - coming soon']);
        });
    });

    // Dashboard aliases (map to available stats)
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [PengajuanController::class, 'stats']);
    });

    // One-off sync endpoints (protected versions kept for future if needed)

    // Letters routes (petugas & superadmin can CRUD; adminpusat read-only)
    Route::prefix('letters')->group(function () {
        // Read list and detail
        Route::middleware('any.role:superadmin,adminpusat,petugas')->group(function () {
            Route::get('/', [LetterController::class, 'index']);
            Route::get('/{letter}', [LetterController::class, 'show']);
        });
        // Create/Update/Delete
        Route::middleware('any.role:superadmin,petugas')->group(function () {
            Route::post('/', [LetterController::class, 'store']);
            Route::put('/{letter}', [LetterController::class, 'update']);
            Route::delete('/{letter}', [LetterController::class, 'destroy']);
        });
    });

    // Personnel search (allow petugas to access for letter generation)
    Route::middleware('any.role:superadmin,adminpusat,operator,petugas')->get('/personnel/search', function (\Illuminate\Http\Request $request) {
        $q = trim((string) $request->query('q', ''));
        $limit = (int) $request->query('limit', 20);
        if ($limit <= 0) { $limit = 20; }
        if ($limit > 50) { $limit = 50; }

        if ($q === '') {
            return response()->json(['data' => []]);
        }

        $items = \App\Models\Employee::query()
            ->where(function ($w) use ($q) {
                $w->where('nip', 'like', "%{$q}%")
                  ->orWhere('nama', 'like', "%{$q}%");
            })
            ->orderBy('nama')
            ->limit($limit)
            ->get(['id', 'nip', 'nama', 'jabatan', 'unit_kerja', 'golongan']);

        return response()->json([
            'data' => $items,
        ]);
    });

});

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});
