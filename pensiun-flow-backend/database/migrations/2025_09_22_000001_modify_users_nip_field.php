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
        Schema::table('users', function (Blueprint $table) {
            // Drop unique constraint first
            $table->dropUnique(['nip']);
            
            // Drop NIP column completely for admin/operator/superadmin
            $table->dropColumn('nip');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add NIP column back
            $table->string('nip', 50)->unique()->after('id');
        });
    }
};
