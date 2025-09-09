<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Letter;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LetterController extends Controller
{
    public function index(Request $request)
    {
        $query = Letter::query();

        if ($s = $request->query('q')) {
            $query->where(function ($q) use ($s) {
                $q->where('nomor_surat', 'like', "%$s%")
                  ->orWhere('nama_pegawai', 'like', "%$s%")
                  ->orWhere('nama_penandatangan', 'like', "%$s%");
            });
        }

        if ($request->boolean('paginate', true)) {
            $perPage = (int) $request->query('per_page', 15);
            return response()->json($query->orderByDesc('created_at')->paginate($perPage));
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function show(Letter $letter)
    {
        return response()->json($letter);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['id'] = (string) Str::uuid();
        $letter = Letter::create($data);
        return response()->json($letter, 201);
    }

    public function update(Request $request, Letter $letter)
    {
        $data = $this->validateData($request, $letter->id);
        $letter->update($data);
        return response()->json($letter);
    }

    public function destroy(Letter $letter)
    {
        $letter->delete();
        return response()->json([ 'deleted' => true ]);
    }

    private function validateData(Request $request, ?string $id = null): array
    {
        $nomorUnique = 'unique:letters,nomor_surat';
        if ($id) {
            $nomorUnique .= ",{$id},id";
        }

        return $request->validate([
            'nomor_surat' => [ 'required', 'string', $nomorUnique ],
            'tanggal_surat' => [ 'required', 'date' ],
            'nama_pegawai' => [ 'required', 'string' ],
            'nip_pegawai' => [ 'nullable', 'string' ],
            'posisi_pegawai' => [ 'nullable', 'string' ],
            'unit_pegawai' => [ 'nullable', 'string' ],
            'nama_penandatangan' => [ 'required', 'string' ],
            'nip_penandatangan' => [ 'nullable', 'string' ],
            'jabatan_penandatangan' => [ 'nullable', 'string' ],
            'signature_place' => [ 'nullable', 'string' ],
            'signature_date_input' => [ 'required', 'date' ],
            'signature_mode' => [ 'required', 'in:manual,tte' ],
            'signature_anchor' => [ 'required', 'in:^,$,#' ],
            'template_version' => [ 'required', 'string' ],
        ]);
    }
}


