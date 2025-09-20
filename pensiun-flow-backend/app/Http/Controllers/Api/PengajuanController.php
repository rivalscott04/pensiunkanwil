<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\PengajuanFile;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PengajuanController extends Controller
{
    /**
     * Display a listing of the pengajuan.
     */
    public function index(Request $request): JsonResponse
    {
        // Optimized eager loading to prevent N+1 queries
        $query = Pengajuan::with([
            'user:id,name,email,role',
            'kabupaten:id,nama,kode',
            'files:id,pengajuan_id,nama_file,jenis_dokumen,is_required',
            'approvedBy:id,name,email'
        ]);

        // Ensure authenticated (avoid redirect to route('login'))
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if ($user->isOperator()) {
            $query->where('kabupaten_id', $user->kabupaten_id);
        }

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('jenis_pensiun')) {
            $query->where('jenis_pensiun', $request->jenis_pensiun);
        }

        if ($request->has('kabupaten_id')) {
            $query->where('kabupaten_id', $request->kabupaten_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama_pegawai', 'like', "%{$search}%")
                  ->orWhere('nip_pegawai', 'like', "%{$search}%")
                  ->orWhere('nomor_pengajuan', 'like', "%{$search}%");
            });
        }

        // Get paginated results with optimized query
        $pengajuan = $query->orderBy('created_at', 'desc')
                           ->paginate($request->get('per_page', 15));

        return response()->json([
            'status' => 'success',
            'data' => $pengajuan
        ]);
    }

    /**
     * Display the specified pengajuan.
     */
    public function show(Pengajuan $pengajuan): JsonResponse
    {
        // Check authorization
        $user = auth()->user();
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Optimized eager loading with specific columns
        $pengajuan->load([
            'user:id,name,email,role,jabatan',
            'kabupaten:id,nama,kode,kepala_daerah',
            'files:id,pengajuan_id,nama_file,nama_asli,jenis_dokumen,is_required,keterangan,created_at',
            'approvedBy:id,name,email,role'
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $pengajuan
        ]);
    }

    /**
     * Store a newly created pengajuan in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nip_pegawai' => 'required|string|max:50',
            'nama_pegawai' => 'required|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'pangkat_golongan' => 'nullable|string|max:50',
            'tanggal_lahir' => 'nullable|date',
            'tanggal_mulai_kerja' => 'nullable|date',
            'masa_kerja_tahun' => 'nullable|integer|min:0',
            'masa_kerja_bulan' => 'nullable|integer|min:0|max:11',
            'gaji_pokok' => 'nullable|numeric|min:0',
            'jenis_pensiun' => 'required|in:normal,dipercepat,khusus',
            'tanggal_pensiun' => 'nullable|date',
            'catatan' => 'nullable|string'
        ]);

        $user = auth()->user();
        
        // Check if user is operator
        if (!$user->isOperator()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only operators can create pengajuan'
            ], 403);
        }

        DB::beginTransaction();
        try {
            $pengajuan = Pengajuan::create([
                'nomor_pengajuan' => Pengajuan::generateNomorPengajuan(),
                'user_id' => $user->id,
                'kabupaten_id' => $user->kabupaten_id,
                'nip_pegawai' => $request->nip_pegawai,
                'nama_pegawai' => $request->nama_pegawai,
                'jabatan' => $request->jabatan,
                'unit_kerja' => $request->unit_kerja,
                'pangkat_golongan' => $request->pangkat_golongan,
                'tanggal_lahir' => $request->tanggal_lahir,
                'tanggal_mulai_kerja' => $request->tanggal_mulai_kerja,
                'masa_kerja_tahun' => $request->masa_kerja_tahun,
                'masa_kerja_bulan' => $request->masa_kerja_bulan,
                'gaji_pokok' => $request->gaji_pokok,
                'jenis_pensiun' => $request->jenis_pensiun,
                'tanggal_pensiun' => $request->tanggal_pensiun,
                'catatan' => $request->catatan,
                'status' => 'draft'
            ]);

            DB::commit();

            // Log activity
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'create',
                'description' => "Created pengajuan: {$pengajuan->nomor_pengajuan} for {$pengajuan->nama_pegawai}",
                'model_type' => Pengajuan::class,
                'model_id' => $pengajuan->id,
                'new_values' => $pengajuan->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => $request->route()->getName(),
                'method' => $request->method()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan created successfully',
                'data' => $pengajuan
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update the specified pengajuan in storage.
     */
    public function update(Request $request, Pengajuan $pengajuan): JsonResponse
    {
        // Check authorization
        $user = auth()->user();
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Only allow updates for draft status
        if ($pengajuan->status !== 'draft') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot update pengajuan that is not in draft status'
            ], 422);
        }

        $request->validate([
            'nip_pegawai' => 'required|string|max:50',
            'nama_pegawai' => 'required|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'pangkat_golongan' => 'nullable|string|max:50',
            'tanggal_lahir' => 'nullable|date',
            'tanggal_mulai_kerja' => 'nullable|date',
            'masa_kerja_tahun' => 'nullable|integer|min:0',
            'masa_kerja_bulan' => 'nullable|integer|min:0|max:11',
            'gaji_pokok' => 'nullable|numeric|min:0',
            'jenis_pensiun' => 'required|in:normal,dipercepat,khusus',
            'tanggal_pensiun' => 'nullable|date',
            'catatan' => 'nullable|string'
        ]);

        $oldValues = $pengajuan->toArray();
        $pengajuan->update($request->all());

        // Log activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'update',
            'description' => "Updated pengajuan: {$pengajuan->nomor_pengajuan}",
            'model_type' => Pengajuan::class,
            'model_id' => $pengajuan->id,
            'old_values' => $oldValues,
            'new_values' => $pengajuan->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan updated successfully',
            'data' => $pengajuan
        ]);
    }

    /**
     * Remove the specified pengajuan from storage.
     */
    public function destroy(Request $request, Pengajuan $pengajuan): JsonResponse
    {
        // Check authorization
        $user = auth()->user();
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Only allow deletion for draft status
        if ($pengajuan->status !== 'draft') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete pengajuan that is not in draft status'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Delete associated files
            foreach ($pengajuan->files as $file) {
                Storage::disk('private')->delete($file->path);
            }
            
            $pengajuan->files()->delete();
            $pengajuan->delete();

            DB::commit();

            // Log activity
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'delete',
                'description' => "Deleted pengajuan: {$pengajuan->nomor_pengajuan}",
                'model_type' => Pengajuan::class,
                'model_id' => $pengajuan->id,
                'old_values' => ['nomor_pengajuan' => $pengajuan->nomor_pengajuan],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => $request->route()->getName(),
                'method' => $request->method()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Submit pengajuan for approval.
     */
    public function submit(Request $request, Pengajuan $pengajuan): JsonResponse
    {
        // Check authorization
        $user = auth()->user();
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Check if pengajuan is in draft status
        if ($pengajuan->status !== 'draft') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only draft pengajuan can be submitted'
            ], 422);
        }

        // Check if required documents are uploaded
        $requiredFiles = $pengajuan->files()->required()->count();
        if ($requiredFiles < 10) { // Assuming 10 required documents
            return response()->json([
                'status' => 'error',
                'message' => 'All required documents must be uploaded before submission'
            ], 422);
        }

        $pengajuan->update([
            'status' => 'diajukan',
            'tanggal_pengajuan' => now()
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'submit',
            'description' => "Submitted pengajuan: {$pengajuan->nomor_pengajuan}",
            'model_type' => Pengajuan::class,
            'model_id' => $pengajuan->id,
            'new_values' => ['status' => 'diajukan', 'tanggal_pengajuan' => now()],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan submitted successfully',
            'data' => $pengajuan
        ]);
    }

    /**
     * Update pengajuan status (for superadmin).
     */
    public function updateStatus(Request $request, Pengajuan $pengajuan): JsonResponse
    {
        $user = auth()->user();
        
        // Only superadmin can update status
        if (!$user->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        $request->validate([
            'status' => 'required|in:diterima,ditolak',
            'catatan' => 'nullable|string'
        ]);

        $oldStatus = $pengajuan->status;
        $pengajuan->update([
            'status' => $request->status,
            'catatan' => $request->catatan,
            'tanggal_approval' => now(),
            'approved_by' => $user->id
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'status_update',
            'description' => "Updated pengajuan status from {$oldStatus} to {$request->status}: {$pengajuan->nomor_pengajuan}",
            'model_type' => Pengajuan::class,
            'model_id' => $pengajuan->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $request->status, 'approved_by' => $user->id],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan status updated successfully',
            'data' => $pengajuan
        ]);
    }

    /**
     * Get pengajuan statistics (cached).
     */
    public function stats(): JsonResponse
    {
        $user = request()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Create cache key based on user role and kabupaten
        $cacheKey = 'pengajuan_stats_' . $user->id . '_' . ($user->kabupaten_id ?? 'all');
        
        // Cache stats for 2 minutes
        $stats = Cache::remember($cacheKey, 120, function () use ($user) {
            $query = Pengajuan::query();

            // Apply role-based filtering
            if ($user->isOperator()) {
                $query->where('kabupaten_id', $user->kabupaten_id);
            }

            return [
                'total' => $query->count(),
                'draft' => $query->clone()->draft()->count(),
                'submitted' => $query->clone()->submitted()->count(),
                'approved' => $query->clone()->approved()->count(),
                'rejected' => $query->clone()->rejected()->count(),
                'this_month' => $query->clone()->whereMonth('created_at', now()->month)->count(),
                'this_year' => $query->clone()->whereYear('created_at', now()->year)->count()
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }
}
