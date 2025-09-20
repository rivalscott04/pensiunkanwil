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
                  ->orWhere('nip', 'like', "%{$search}%")
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
}
