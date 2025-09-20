<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Jobs\SyncEmployeesJob;
use App\Models\ActivityLog;
use App\Models\Employee;

class SyncController extends Controller
{
    /**
     * Trigger a one-off sync of employees from external APIs.
     * Returns 202 immediately while a queued job performs the sync.
     */
    public function syncEmployees(Request $request): JsonResponse
    {
        $user = $request->user();
        $triggeredBy = $user?->id;

        // Run synchronously to provide immediate feedback
        // Pass null if no authenticated user to avoid FK violation on activity_logs.user_id
        $job = new \App\Jobs\SyncEmployeesJob($triggeredBy);
        app()->call([$job, 'handle']);

        return response()->json([
            'status' => 'ok',
            'message' => 'Sync completed',
            'data' => [
                'fetched' => $job->fetchedCount,
                'upserted' => $job->upsertedCount,
            ]
        ]);
    }

    /**
     * Return last sync timestamp and counts
     */
    public function syncStatus(Request $request): JsonResponse
    {
        $lastLog = ActivityLog::where('action', 'sync_employees')->latest('created_at')->first();
        $lastSyncAt = $lastLog?->created_at?->toISOString();
        $count = Employee::count();

        return response()->json([
            'last_sync_at' => $lastSyncAt,
            'employees_count' => $count,
        ]);
    }
}


