<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pengajuan_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_id')->constrained('pengajuan')->onDelete('cascade');
            $table->string('nama_file', 255);
            $table->string('nama_asli', 255);
            $table->string('path', 500);
            $table->string('mime_type', 100);
            $table->bigInteger('size')->comment('Size in bytes');
            $table->enum('jenis_dokumen', [
                'pengantar', 'dpcp', 'sk_cpns', 'skkp_terakhir', 
                'super_hd', 'super_pidana', 'pas_foto', 'buku_nikah', 
                'kartu_keluarga', 'skp_terakhir', 'lainnya'
            ]);
            $table->boolean('is_required')->default(true);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan_files');
    }
};
