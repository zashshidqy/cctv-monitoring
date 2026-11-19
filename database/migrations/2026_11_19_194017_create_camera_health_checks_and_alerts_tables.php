<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Camera health checks table (log of every probe attempt)
        Schema::create('camera_health_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('camera_id')->constrained('cameras')->cascadeOnDelete();
            $table->enum('protocol', ['rtsp', 'onvif', 'hls', 'webrtc', 'snapshot'])->default('rtsp');
            $table->unsignedInteger('latency_ms')->nullable();
            $table->string('result')->default('unknown'); // success, failure, timeout, network_error

            // Detailed result diagnostics (JSON format)
            $table->json('diagnostics')->nullable();

            // Timestamp when probe was executed
            $table->timestamp('probed_at');
            $table->timestamps();

            $table->index(['camera_id', 'probed_at']);
            $table->index(['result', 'probed_at']);
        });

        // Camera alerts table (deduped and grouped alerts)
        Schema::create('camera_alerts', function (Blueprint $table) {
            $table->id();
            $table->enum('level', ['warning', 'critical'])->default('critical'); // warning for unstable, critical for offline

            // Associated camera (demoted to nullable for recovery events without active camera)
            $table->foreignId('camera_id')->nullable()->constrained('cameras')->nullOnDelete();

            // Store where alert originated
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();

            $table->string('type')->default('offline'); // offline, unstable_connection, camera_reboot, network_issue
            $table->text('summary');

            // Learning failsafe count (number of consecutive failures triggering this alert)
            $table->unsignedInteger('failure_count')->default(1);
            $table->boolean('is_resolved')->default(false);

            // Recovery timestamp (auto-detected when health check returns success)
            $table->timestamp('recovered_at')->nullable();

            // For active alerts, when it was first created/fired
            $table->timestamp('first_fired_at');
            $table->timestamp('last_fired_at');

            // Policy approval request
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['store_id', 'is_resolved', 'approval_status']);
            $table->index(['camera_id', 'is_resolved']);
            $table->index(['first_fired_at', 'approval_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('camera_alerts');
        Schema::dropIfExists('camera_health_checks');
    }
};
