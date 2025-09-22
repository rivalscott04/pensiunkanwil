<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * List users with optional filters (role, search) and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        // Optimized eager loading to prevent N+1 queries
        $query = User::query()->with([
            'kabupaten:id,nama,kode'
        ]);

        // Exclude superadmin by default from listings (useful for impersonation target)
        if ($request->boolean('exclude_superadmin', true)) {
            $query->where('role', '!=', 'superadmin');
        }

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        // Support search by q or search param
        $search = trim((string) ($request->query('q') ?? $request->query('search') ?? ''));
        if ($search !== '') {
            $query->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('jabatan', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('paginate', true)) {
            $perPage = (int) $request->query('per_page', 15);
            $perPage = max(1, min(100, $perPage));
            $data = $query->orderBy('name')->paginate($perPage);
            return response()->json([ 'status' => 'success', 'data' => $data ]);
        }

        $items = $query->orderBy('name')->get();
        return response()->json([ 'status' => 'success', 'data' => $items ]);
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:superadmin,adminpusat,operator,petugas',
            'kabupaten_id' => 'nullable|exists:kabupaten,id',
            'jabatan' => 'nullable|string|max:255',
            'status_user' => 'nullable|in:aktif,nonaktif'
        ]);

        $validated['password'] = bcrypt($validated['password']);
        $validated['status_user'] = $validated['status_user'] ?? 'aktif';

        $user = User::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $user->load('kabupaten')
        ], 201);
    }

    /**
     * Show a specific user
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $user->load('kabupaten')
        ]);
    }

    /**
     * Update a user
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|required|in:superadmin,adminpusat,operator,petugas',
            'kabupaten_id' => 'nullable|exists:kabupaten,id',
            'jabatan' => 'nullable|string|max:255',
            'status_user' => 'sometimes|in:aktif,nonaktif'
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $user->load('kabupaten')
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Get current user profile
     */
    public function profile(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => auth()->user()->load('kabupaten')
        ]);
    }

    /**
     * Update current user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'jabatan' => 'nullable|string|max:255'
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $user->load('kabupaten')
        ]);
    }
}
