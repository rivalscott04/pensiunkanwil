<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\PengajuanFile;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FileController extends Controller
{
    /**
     * Upload file for pengajuan.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'pengajuan_id' => 'required|exists:pengajuan,id',
            'file' => 'required|file|mimes:pdf|max:350', // 350KB limit
            'jenis_dokumen' => 'required|in:pengantar,dpcp,sk_cpns,skkp_terakhir,super_hd,super_pidana,pas_foto,buku_nikah,kartu_keluarga,skp_terakhir,sk_pensiun,lainnya',
            'is_required' => 'boolean',
            'keterangan' => 'nullable|string'
        ]);

        $user = auth()->user();
        $pengajuan = Pengajuan::findOrFail($request->pengajuan_id);

        // Check authorization
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Allow uploads only when draft, except superadmin may upload SK Pensiun anytime
        $isUploadingSkPensiun = $request->jenis_dokumen === 'sk_pensiun';
        if ($pengajuan->status !== 'draft' && !($user->isSuperAdmin() && $isUploadingSkPensiun)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot upload files for pengajuan that is not in draft status'
            ], 422);
        }

        $file = $request->file('file');
        $fileName = Str::random(40) . '.' . $file->getClientOriginalExtension();
        $filePath = 'pengajuan/' . $pengajuan->id . '/' . $fileName;

        // Store file in private disk
        $file->storeAs('pengajuan/' . $pengajuan->id, $fileName, 'private');

        DB::beginTransaction();
        try {
            // Check if file of this type already exists
            $existingFile = PengajuanFile::where('pengajuan_id', $pengajuan->id)
                ->where('jenis_dokumen', $request->jenis_dokumen)
                ->first();

            if ($existingFile) {
                // Delete old file
                Storage::disk('private')->delete($existingFile->path);
                $existingFile->delete();
            }

            // Create new file record
            $pengajuanFile = PengajuanFile::create([
                'pengajuan_id' => $pengajuan->id,
                'nama_file' => $fileName,
                'nama_asli' => $file->getClientOriginalName(),
                'path' => $filePath,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'jenis_dokumen' => $request->jenis_dokumen,
                'is_required' => $request->get('is_required', true),
                'keterangan' => $request->keterangan
            ]);

            DB::commit();

            // Log activity
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'file_upload',
                'description' => "Uploaded {$request->jenis_dokumen} for pengajuan: {$pengajuan->nomor_pengajuan}",
                'model_type' => PengajuanFile::class,
                'model_id' => $pengajuanFile->id,
                'new_values' => $pengajuanFile->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => $request->route()->getName(),
                'method' => $request->method()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'File uploaded successfully',
                'data' => $pengajuanFile
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            // Clean up uploaded file
            Storage::disk('private')->delete($filePath);
            throw $e;
        }
    }

    /**
     * Download file.
     */
    public function download(PengajuanFile $file): JsonResponse
    {
        $user = auth()->user();
        $pengajuan = $file->pengajuan;

        // Check authorization
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Check if file exists
        if (!Storage::disk('private')->exists($file->path)) {
            return response()->json([
                'status' => 'error',
                'message' => 'File not found'
            ], 404);
        }

        // Log download activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'file_download',
            'description' => "Downloaded file: {$file->nama_asli}",
            'model_type' => PengajuanFile::class,
            'model_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'route' => request()->route()->getName(),
            'method' => request()->method()
        ]);

        // Return file download response
        return response()->json([
            'status' => 'success',
            'data' => [
                'download_url' => route('api.files.download', $file->id),
                'file_info' => [
                    'nama_asli' => $file->nama_asli,
                    'size' => $file->size_human,
                    'mime_type' => $file->mime_type
                ]
            ]
        ]);
    }

    /**
     * Delete file.
     */
    public function destroy(Request $request, PengajuanFile $file): JsonResponse
    {
        $user = auth()->user();
        $pengajuan = $file->pengajuan;

        // Check authorization
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
                'message' => 'Cannot delete files for pengajuan that is not in draft status'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Delete physical file
            Storage::disk('private')->delete($file->path);
            
            // Delete database record
            $file->delete();

            DB::commit();

            // Log activity
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'file_delete',
                'description' => "Deleted file: {$file->nama_asli}",
                'model_type' => PengajuanFile::class,
                'model_id' => $file->id,
                'old_values' => $file->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => $request->route()->getName(),
                'method' => $request->method()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'File deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get files for pengajuan.
     */
    public function getFiles(Pengajuan $pengajuan): JsonResponse
    {
        $user = auth()->user();

        // Check authorization
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        $files = $pengajuan->files()->orderBy('jenis_dokumen')->get();

        return response()->json([
            'status' => 'success',
            'data' => $files
        ]);
    }

    /**
     * Get file preview info.
     */
    public function preview(PengajuanFile $file): JsonResponse
    {
        $user = auth()->user();
        $pengajuan = $file->pengajuan;

        // Check authorization
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $file->id,
                'nama_asli' => $file->nama_asli,
                'jenis_dokumen' => $file->jenis_dokumen,
                'size' => $file->size_human,
                'mime_type' => $file->mime_type,
                'is_required' => $file->is_required,
                'keterangan' => $file->keterangan,
                'created_at' => $file->created_at,
                'is_pdf' => $file->isPdf(),
                'is_image' => $file->isImage(),
                'extension' => $file->extension
            ]
        ]);
    }

    /**
     * Bulk upload files for pengajuan.
     */
    public function bulkUpload(Request $request): JsonResponse
    {
        $request->validate([
            'pengajuan_id' => 'required|exists:pengajuan,id',
            'files.*' => 'required|file|mimes:pdf|max:350',
            'jenis_dokumen.*' => 'required|in:pengantar,dpcp,sk_cpns,skkp_terakhir,super_hd,super_pidana,pas_foto,buku_nikah,kartu_keluarga,skp_terakhir,sk_pensiun,lainnya'
        ]);

        $user = auth()->user();
        $pengajuan = Pengajuan::findOrFail($request->pengajuan_id);

        // Check authorization
        if ($user->isOperator() && $pengajuan->kabupaten_id !== $user->kabupaten_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        // For bulk upload, keep draft-only restriction (superadmin can upload SK Pensiun individually via single upload)
        if ($pengajuan->status !== 'draft') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot bulk upload files for pengajuan that is not in draft status'
            ], 422);
        }

        $uploadedFiles = [];
        $errors = [];

        foreach ($request->file('files') as $index => $file) {
            try {
                $fileName = Str::random(40) . '.' . $file->getClientOriginalExtension();
                $filePath = 'pengajuan/' . $pengajuan->id . '/' . $fileName;
                $jenisDokumen = $request->jenis_dokumen[$index] ?? 'lainnya';

                // Store file
                $file->storeAs('pengajuan/' . $pengajuan->id, $fileName, 'private');

                // Check if file of this type already exists
                $existingFile = PengajuanFile::where('pengajuan_id', $pengajuan->id)
                    ->where('jenis_dokumen', $jenisDokumen)
                    ->first();

                if ($existingFile) {
                    // Delete old file
                    Storage::disk('private')->delete($existingFile->path);
                    $existingFile->delete();
                }

                // Create file record
                $pengajuanFile = PengajuanFile::create([
                    'pengajuan_id' => $pengajuan->id,
                    'nama_file' => $fileName,
                    'nama_asli' => $file->getClientOriginalName(),
                    'path' => $filePath,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'jenis_dokumen' => $jenisDokumen,
                    'is_required' => true,
                    'keterangan' => null
                ]);

                $uploadedFiles[] = $pengajuanFile;

            } catch (\Exception $e) {
                $errors[] = "Failed to upload {$file->getClientOriginalName()}: " . $e->getMessage();
            }
        }

        // Log activity
        if (!empty($uploadedFiles)) {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'bulk_file_upload',
                'description' => "Bulk uploaded " . count($uploadedFiles) . " files for pengajuan: {$pengajuan->nomor_pengajuan}",
                'model_type' => Pengajuan::class,
                'model_id' => $pengajuan->id,
                'new_values' => ['files_count' => count($uploadedFiles)],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => $request->route()->getName(),
                'method' => $request->method()
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Bulk upload completed',
            'data' => [
                'uploaded_files' => $uploadedFiles,
                'errors' => $errors
            ]
        ]);
    }
}
