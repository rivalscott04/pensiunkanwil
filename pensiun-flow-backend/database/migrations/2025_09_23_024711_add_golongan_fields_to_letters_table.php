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
            $table->string('golongan_penandatangan')->nullable()->after('jabatan_penandatangan');
            $table->string('golongan_pegawai')->nullable()->after('unit_pegawai');
            $table->index('golongan_penandatangan');
            $table->index('golongan_pegawai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letters', function (Blueprint $table) {
            $table->dropIndex(['golongan_penandatangan']);
            $table->dropIndex(['golongan_pegawai']);
            $table->dropColumn(['golongan_penandatangan', 'golongan_pegawai']);
        });
    }
};
