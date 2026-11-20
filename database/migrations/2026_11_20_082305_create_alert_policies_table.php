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
        Schema::create('alert_policies', function (Blueprint $table) {
            $table->id();
            $table->string('role'); // master_admin, gm, sv, staff
            $table->string('alert_level')->nullable(); // warning, critical, or null for all
            $table->json('allowed_types')->nullable(); // ['offline', 'unstable_connection', 'camera_reboot', 'network_issue'] or null for all
            $table->boolean('require_approval')->default(true); // Whether GM/SV must approve before action
            $table->integer('deduplication_minutes')->default(5); // Deduplication window in minutes
            $table->boolean('enabled')->default(true);
            $table->json('metadata')->nullable(); // Additional config per role
            $table->timestamps();

            $table->unique('role');
            $table->index(['role', 'enabled']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alert_policies');
    }
};
