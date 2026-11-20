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
        Schema::create('gateways', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->string('type', 20)->default('edge'); // central, edge
            $table->foreignId('store_id')->nullable()->constrained('stores')->nullOnDelete();
            $table->string('host')->nullable();
            $table->unsignedInteger('port')->default(8554);
            $table->string('status', 20)->default('online'); // online, offline, degraded
            $table->string('version', 50)->nullable();
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index(['store_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gateways');
    }
};
