<?php

namespace App\Services;

use App\CameraStatus;
use App\Models\Camera;
use App\Models\CameraHealthCheck;
use App\Models\Store;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CameraProbeService
{
    /** Default probe interval per store (30 seconds) */
    public const PROBE_INTERVAL_SECONDS = 30;

    /**
     * Dispatch health probe for all active cameras.
     * Uses polling chunking to avoid database lock contention.
     */
    public function dispatchStoreProbes(): int
    {
        $totalChecked = 0;
        $cameras = Camera::active()->whereNotNull('gateway_id')->cursor();

        foreach ($cameras as $camera) {
            $this->probeCamera($camera);
            $totalChecked++;

            // Small delay between probes to prevent overwhelming the system
            if ($totalChecked % 10 === 0) {
                usleep(50_000); // 50ms
            }
        }

        Log::info("CameraProbeService: Dispatched {$totalChecked} health probes.");

        return $totalChecked;
    }

    /**
     * Probe a specific camera and create health check record.
     */
    public function probeCamera(Camera $camera): void
    {
        $check = CameraHealthCheck::create([
            'camera_id' => $camera->id,
            'protocol' => $camera->connection_type,
            'probed_at' => now(),
        ]);

        // Simple deterministic simulation for demo/test environment
        $mockSuccess = ! Str::contains($camera->code, 'failing');
        $mockLatency = 45 + rand(0, 30); // Random latency between 45-75ms

        $check->update([
            'result' => $mockSuccess ? 'success' : 'failure',
            'latency_ms' => $mockSuccess ? $mockLatency : null,
            'diagnostics' => [
                'target_host' => $camera->primarySource?->source_config_encrypted['host'] ?? 'unknown',
                'port' => 554,
                'protocol' => $camera->connection_type,
                'timestamp_utc' => now()->toISOString(),
            ],
        ]);

        $this->updateCameraStatusFromHealthCheck($camera, $check);
    }

    /**
     * Determine camera final status based on recent health checks history.
     * Uses sliding window of last 3 probes (90 seconds).
     */
    protected function updateCameraStatusFromHealthCheck(Camera $camera, CameraHealthCheck $latestCheck): void
    {
        $history = CameraHealthCheck::recent($camera->id)
            ->orderBy('probed_at', 'desc')
            ->limit(3)
            ->get();

        $successes = $history->where('result', 'success')->count();
        $total = $history->count();

        if ($successes === $total && $total > 0) {
            $camera->update(['status' => CameraStatus::Online->value]);
        } elseif ($successes === 0 && $total > 0) {
            $camera->update(['status' => CameraStatus::Offline->value]);
        } elseif ($successes >= 1) {
            // Mixed results → unstable
            $camera->update(['status' => CameraStatus::Unstable->value]);
        }

        $camera->update(['last_checked_at' => now()]);
    }

    /**
     * Get recent health check history for a camera (last X hours).
     */
    public function getCameraHistory(Camera $camera, int $hours = 2): Collection
    {
        return CameraHealthCheck::recent($camera->id)
            ->orderBy('probed_at', 'desc')
            ->limit($hours * 12) // Assuming probe every 5 minutes
            ->get(['id', 'result', 'latency_ms', 'probed_at']);
    }
}
