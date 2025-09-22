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
        Schema::table('letters', function (Blueprint $table) {
            // Fields for Surat Meninggal
            $table->date('tanggal_meninggal')->nullable()->after('addressee_kota');
            $table->text('dasar_surat')->nullable()->after('tanggal_meninggal');
            
            // Fields for multiple pegawai (Pengantar Gelar/Pensiun, SPTJM)
            $table->json('pegawai_data')->nullable()->after('dasar_surat');
            
            // Fields for SPTJM surat rujukan
            $table->string('nomor_surat_rujukan')->nullable()->after('pegawai_data');
            $table->date('tanggal_surat_rujukan')->nullable()->after('nomor_surat_rujukan');
            $table->text('perihal_surat_rujukan')->nullable()->after('tanggal_surat_rujukan');
            
            // Index for search
            $table->index('tanggal_meninggal');
            $table->index('nomor_surat_rujukan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letters', function (Blueprint $table) {
            $table->dropIndex(['tanggal_meninggal']);
            $table->dropIndex(['nomor_surat_rujukan']);
            $table->dropColumn([
                'tanggal_meninggal',
                'dasar_surat', 
                'pegawai_data',
                'nomor_surat_rujukan',
                'tanggal_surat_rujukan',
                'perihal_surat_rujukan'
            ]);
        });
    }
};
