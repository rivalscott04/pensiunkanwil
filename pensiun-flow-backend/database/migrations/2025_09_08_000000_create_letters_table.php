<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('letters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nomor_surat')->unique();
            $table->date('tanggal_surat');
            $table->string('nama_pegawai');
            $table->string('nip_pegawai')->nullable();
            $table->string('posisi_pegawai')->nullable();
            $table->string('unit_pegawai')->nullable();
            $table->string('nama_penandatangan');
            $table->string('nip_penandatangan')->nullable();
            $table->string('jabatan_penandatangan')->nullable();
            $table->string('signature_place')->nullable();
            $table->string('signature_date_input');
            $table->enum('signature_mode', ['manual', 'tte'])->default('manual');
            $table->enum('signature_anchor', ['^', '$', '#'])->default('^');
            $table->string('template_version')->default('v1');
            $table->timestamps();
            $table->softDeletes();

            $table->index('nomor_surat');
            $table->index('tanggal_surat');
            $table->index('nama_pegawai');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('letters');
    }
};


