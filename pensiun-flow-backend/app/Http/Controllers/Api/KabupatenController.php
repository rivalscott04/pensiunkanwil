<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kabupaten;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class KabupatenController extends Controller
{
    /**
     * Display a listing of the kabupaten.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Kabupaten::query();

        // Apply filters
        if ($request->has('jenis')) {
            $query->where('jenis', $request->jenis);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('kode', 'like', "%{$search}%")
                  ->orWhere('kepala_daerah', 'like', "%{$search}%");
            });
        }

        // Get paginated results
        $kabupaten = $query->orderBy('nama')->paginate($request->get('per_page', 15));

        return response()->json([
            'status' => 'success',
            'data' => $kabupaten
        ]);
    }

    /**
     * Display the specified kabupaten.
     */
    public function show(Kabupaten $kabupaten): JsonResponse
    {
        $kabupaten->load(['users', 'pengajuan']);

        return response()->json([
            'status' => 'success',
            'data' => $kabupaten
        ]);
    }

    /**
     * Store a newly created kabupaten in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'kode' => 'required|string|max:10|unique:kabupaten',
            'nama' => 'required|string|max:255',
            'jenis' => 'required|in:kabupaten,kota',
            'kepala_daerah' => 'nullable|string|max:255',
            'alamat' => 'nullable|string',
            'kode_pos' => 'nullable|string|max:10',
            'telepon' => 'nullable|string|max:20',
            'status' => 'nullable|in:aktif,nonaktif'
        ]);

        $kabupaten = Kabupaten::create($request->all());

        // Clear cache
        Cache::forget('kabupaten');

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'create',
            'description' => "Created kabupaten: {$kabupaten->nama}",
            'model_type' => Kabupaten::class,
            'model_id' => $kabupaten->id,
            'new_values' => $kabupaten->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kabupaten created successfully',
            'data' => $kabupaten
        ], 201);
    }

    /**
     * Update the specified kabupaten in storage.
     */
    public function update(Request $request, Kabupaten $kabupaten): JsonResponse
    {
        $request->validate([
            'kode' => 'required|string|max:10|unique:kabupaten,kode,' . $kabupaten->id,
            'nama' => 'required|string|max:255',
            'jenis' => 'required|in:kabupaten,kota',
            'kepala_daerah' => 'nullable|string|max:255',
            'alamat' => 'nullable|string',
            'kode_pos' => 'nullable|string|max:10',
            'telepon' => 'nullable|string|max:20',
            'status' => 'nullable|in:aktif,nonaktif'
        ]);

        $oldValues = $kabupaten->toArray();
        $kabupaten->update($request->all());

        // Clear cache
        Cache::forget('kabupaten');

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'update',
            'description' => "Updated kabupaten: {$kabupaten->nama}",
            'model_type' => Kabupaten::class,
            'model_id' => $kabupaten->id,
            'old_values' => $oldValues,
            'new_values' => $kabupaten->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kabupaten updated successfully',
            'data' => $kabupaten
        ]);
    }

    /**
     * Remove the specified kabupaten from storage.
     */
    public function destroy(Request $request, Kabupaten $kabupaten): JsonResponse
    {
        // Check if kabupaten has related data
        if ($kabupaten->users()->exists() || $kabupaten->pengajuan()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete kabupaten with related data'
            ], 422);
        }

        $kabupatenName = $kabupaten->nama;
        $kabupaten->delete();

        // Clear cache
        Cache::forget('kabupaten');

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'delete',
            'description' => "Deleted kabupaten: {$kabupatenName}",
            'model_type' => Kabupaten::class,
            'model_id' => $kabupaten->id,
            'old_values' => ['nama' => $kabupatenName],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kabupaten deleted successfully'
        ]);
    }

    /**
     * Get all active kabupaten (cached).
     */
    public function active(): JsonResponse
    {
        $kabupaten = Cache::remember('kabupaten', 3600, function () {
            return Kabupaten::active()->orderBy('nama')->get();
        });

        return response()->json([
            'status' => 'success',
            'data' => $kabupaten
        ]);
    }

    /**
     * Get kabupaten statistics.
     */
    public function stats(): JsonResponse
    {
        $stats = Cache::remember('kabupaten_stats', 1800, function () {
            return [
                'total' => Kabupaten::count(),
                'kabupaten' => Kabupaten::kabupaten()->count(),
                'kota' => Kabupaten::kota()->count(),
                'aktif' => Kabupaten::active()->count(),
                'nonaktif' => Kabupaten::where('status', 'nonaktif')->count()
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }
}
