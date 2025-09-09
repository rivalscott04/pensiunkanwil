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
        Schema::create('pengajuan', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_pengajuan', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('kabupaten_id')->constrained('kabupaten')->onDelete('restrict');
            $table->string('nip_pegawai', 50);
            $table->string('nama_pegawai', 255);
            $table->string('jabatan', 255)->nullable();
            $table->string('unit_kerja', 255)->nullable();
            $table->string('pangkat_golongan', 50)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->date('tanggal_mulai_kerja')->nullable();
            $table->integer('masa_kerja_tahun')->default(0);
            $table->integer('masa_kerja_bulan')->default(0);
            $table->decimal('gaji_pokok', 15, 2)->nullable();
            $table->enum('jenis_pensiun', ['normal', 'dipercepat', 'khusus'])->default('normal');
            $table->date('tanggal_pensiun')->nullable();
            $table->enum('status', ['draft', 'diajukan', 'diterima', 'ditolak'])->default('draft');
            $table->text('catatan')->nullable();
            $table->timestamp('tanggal_pengajuan')->nullable();
            $table->timestamp('tanggal_approval')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan');
    }
};
