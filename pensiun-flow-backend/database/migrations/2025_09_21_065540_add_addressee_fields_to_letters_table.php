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
            $table->string('addressee_jabatan')->nullable()->after('perihal');
            $table->string('addressee_kota')->nullable()->after('addressee_jabatan');
            $table->index('addressee_jabatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letters', function (Blueprint $table) {
            $table->dropIndex(['addressee_jabatan']);
            $table->dropColumn(['addressee_jabatan', 'addressee_kota']);
        });
    }
};
