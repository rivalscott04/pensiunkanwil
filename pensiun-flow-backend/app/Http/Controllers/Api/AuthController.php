<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Lab404\Impersonate\Services\ImpersonateManager;

class AuthController extends Controller
{
    /**
     * Login user and create token
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status_user !== 'aktif') {
            throw ValidationException::withMessages([
                'email' => ['Your account is deactivated.'],
            ]);
        }

        // Update last login
        $user->update(['last_login' => now()]);

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Log activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'description' => 'User logged in successfully',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'nip' => $user->nip,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'kabupaten' => $user->kabupaten,
                    'jabatan' => $user->jabatan
                ],
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    /**
     * Logout user and revoke token
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Log activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'logout',
            'description' => 'User logged out successfully',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        // Revoke token
        $user->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout successful'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('kabupaten');

        // Detect impersonation state
        /** @var ImpersonateManager $impersonate */
        $impersonate = app(ImpersonateManager::class);
        $isImpersonating = $impersonate->isImpersonating();
        $impersonator = $isImpersonating ? $impersonate->getImpersonator() : null;
        $impersonated = $isImpersonating ? $user : null; // current user is the impersonated account

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'nip' => $user->nip,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'kabupaten' => $user->kabupaten,
                    'jabatan' => $user->jabatan,
                    'status_user' => $user->status_user,
                    'last_login' => $user->last_login
                ],
                'impersonation' => [
                    'is_impersonating' => $isImpersonating,
                    'impersonator' => $impersonator ? [ 'id' => $impersonator->id, 'name' => $impersonator->name, 'email' => $impersonator->email, 'role' => $impersonator->role ] : null,
                    'impersonated' => $impersonated ? [ 'id' => $impersonated->id, 'name' => $impersonated->name, 'email' => $impersonated->email, 'role' => $impersonated->role ] : null,
                ]
            ]
        ]);
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Revoke current token
        $user->currentAccessToken()->delete();
        
        // Create new token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Token refreshed successfully',
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    /**
     * Impersonate another user (Superadmin only)
     */
    public function impersonate(Request $request, ImpersonateManager $impersonate): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = $request->user();
        $targetUser = User::findOrFail($request->user_id);

        if (!$user->canImpersonate()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not authorized to impersonate users'
            ], 403);
        }

        if (!$targetUser->canBeImpersonated()) {
            return response()->json([
                'status' => 'error',
                'message' => 'This user cannot be impersonated'
            ], 403);
        }

        // Start impersonation
        $impersonate->start($request, $targetUser);

        // Log activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'impersonate',
            'description' => "User {$user->name} impersonated user {$targetUser->name}",
            'model_type' => User::class,
            'model_id' => $targetUser->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Now impersonating {$targetUser->name}",
            'data' => [
                'impersonated_user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'role' => $targetUser->role
                ]
            ]
        ]);
    }

    /**
     * Stop impersonation
     */
    public function stopImpersonate(Request $request, ImpersonateManager $impersonate): JsonResponse
    {
        $user = $request->user();
        $impersonatedUser = $impersonate->getImpersonated();

        if (!$impersonatedUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'No active impersonation'
            ], 400);
        }

        // Stop impersonation
        $impersonate->stop();

        // Log activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'stop_impersonate',
            'description' => "User {$user->name} stopped impersonating user {$impersonatedUser->name}",
            'model_type' => User::class,
            'model_id' => $impersonatedUser->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route()->getName(),
            'method' => $request->method()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Impersonation stopped successfully'
        ]);
    }
}
