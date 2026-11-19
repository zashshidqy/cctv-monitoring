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
        // Cameras table
        Schema::create('cameras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->unsignedBigInteger('gateway_id')->nullable(); // For edge gateways in Epic 5-7
            $table->string('code')->unique();
            $table->string('name');
            $table->string('area_label'); // e.g. "Kasir Utama", "Entrance", "Loading Dock"
            $table->unsignedInteger('channel_number')->nullable();
            $table->string('device_type')->default('ip_camera'); // ip_camera, nvr_channel, dvr_channel, other
            $table->string('connection_type')->default('rtsp'); // onvif, rtsp, hls, webrtc, mjpeg, snapshot, vendor, custom
            $table->string('status')->default('unknown'); // online, unstable, offline, unknown
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'is_active']);
            $table->index(['status', 'is_active']);
        });

        // Camera Sources table (encrypted source configurations & credentials)
        Schema::create('camera_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('camera_id')->constrained('cameras')->cascadeOnDelete();
            $table->string('source_kind')->default('rtsp'); // rtsp, onvif, hls, webrtc, mjpeg, snapshot
            $table->text('source_config_encrypted'); // Encrypted JSON payload via Laravel Crypt
            $table->boolean('is_primary')->default(true);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['camera_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('camera_sources');
        Schema::dropIfExists('cameras');
    }
};
