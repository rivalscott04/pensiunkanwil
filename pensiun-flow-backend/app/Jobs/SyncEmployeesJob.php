<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\ActivityLog;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SyncEmployeesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public ?int $triggeredByUserId;
    public int $fetchedCount = 0;
    public int $upsertedCount = 0;

    public function __construct(?int $triggeredByUserId)
    {
        $this->triggeredByUserId = $triggeredByUserId;
    }

    public function handle(): void
    {
        $endpoint = 'http://103.41.207.103/api/public/employees/all';

        try {
            $response = Http::acceptJson()->get($endpoint);

            if (!$response->successful()) {
                throw new \RuntimeException('Failed to fetch employees: HTTP ' . $response->status());
            }

            $payload = $response->json();
            $employees = $payload['data'] ?? [];

            $now = now();
            $rows = [];
            foreach ($employees as $item) {
                // Normalize fields from external API to our schema
                $tmt = $item['tmt_pensiun'] ?? null;
                $tmtDate = null;
                if (!empty($tmt)) {
                    try {
                        $tmtDate = Carbon::parse($tmt)->toDateString();
                    } catch (\Throwable $e) {
                        $tmtDate = null;
                    }
                }

                $rows[] = [
                    'nip' => (string)($item['nip'] ?? ''),
                    'nama' => (string)($item['nama'] ?? ''),
                    'jabatan' => $item['jabatan'] ?? null,
                    'golongan' => $item['golongan'] ?? null,
                    'tmt_pensiun' => $tmtDate,
                    'unit_kerja' => $item['unit_kerja'] ?? null,
                    'induk_unit' => $item['induk_unit'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Filter out empty NIP entries to satisfy unique constraint
            $rows = array_values(array_filter($rows, fn ($r) => !empty($r['nip'])));

            // Upsert in chunks to avoid memory issues
            $chunkSize = 1000;
            foreach (array_chunk($rows, $chunkSize) as $chunk) {
                DB::table('employees')->upsert(
                    $chunk,
                    ['nip'],
                    ['nama','jabatan','golongan','tmt_pensiun','unit_kerja','induk_unit','updated_at']
                );
            }

            $total = is_countable($employees) ? count($employees) : 0;
            $this->fetchedCount = $total;
            $this->upsertedCount = is_countable($rows) ? count($rows) : 0;

            Log::info('SyncEmployeesJob completed', [
                'fetched' => $this->fetchedCount,
                'upserted' => $this->upsertedCount,
            ]);

            ActivityLog::create([
                'user_id' => $this->triggeredByUserId,
                'action' => 'sync_employees',
                'description' => 'Synced employees from external API',
                'new_values' => ['count' => $total],
            ]);

        } catch (\Throwable $e) {
            Log::error('SyncEmployeesJob failed', ['error' => $e->getMessage()]);
            $this->fail($e);
        }
    }
}


