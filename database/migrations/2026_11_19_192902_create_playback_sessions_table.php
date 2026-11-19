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
        Schema::create('playback_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->unique(); // UUID / secure random identifier
            $table->foreignId('camera_id')->constrained('cameras')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('gateway_id')->nullable();
            $table->string('output_protocol')->default('webrtc'); // webrtc, hls, mjpeg
            $table->string('session_token', 64)->unique(); // Scoped authorization token
            $table->string('playback_url'); // Client playback URL (safe, no source secrets)
            $table->timestamp('started_at');
            $table->timestamp('expires_at');
            $table->timestamp('ended_at')->nullable();
            $table->string('status')->default('active'); // active, expired, released
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['camera_id', 'status']);
            $table->index(['expires_at', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('playback_sessions');
    }
};
