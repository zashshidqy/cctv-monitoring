<?php

namespace App\Services;

use App\Models\CameraAlert;
use App\Models\CameraHealthCheck;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CameraAlertService
{
    /** Alert buoyancy duration: first_fired_at within this many hours is considered "new" */
    public const ALERT_WINDOW_HOURS = 24;

    /** Deduplication key format: "{alert_type}_{store_id}_{first_fired_at_date}" */
    public const ALERT_KEY_PREFIX = 'camera_alert_dedup';

    /**
     * Check recent health checks and trigger/create alerts if threshold crossed.
     * Uses race condition protection: checks if alert already exists before creating.
     */
    public function checkAndTriggerAlerts(): int
    {
        // Get all failed health checks from the last hour
        $failedChecks = CameraHealthCheck::recent(1)
            ->byResult('failure')
            ->orderBy('probed_at', 'desc')
            ->get();

        $alertsTriggered = 0;

        foreach ($failedChecks as $check) {
            $camera = $check->camera;

            // Skip cameras that should be ignored
            if (! $camera->is_active || ! $camera->store_id) {
                continue;
            }

            // Check if alert already exists for this camera/store within alert window
            if ($this->alertExistsForCameraAndStore($camera->id, $camera->store_id, $check)) {
                // Update existing alert failure count
                $this->notifyExistingAlert($camera, $check);
            } else {
                // Create new alert
                $this->createAlert($camera, $check);
                $alertsTriggered++;
            }
        }

        Log::info("CameraAlertService: Checked {$failedChecks->count()} failed health checks. {$alertsTriggered} new alerts triggered.");

        return $alertsTriggered;
    }

    /**
     * Check if alert already exists (deduplication logic).
     */
    protected function alertExistsForCameraAndStore(int $cameraId, int $storeId, CameraHealthCheck $check): bool
    {
        $key = sprintf('%s:%d:%d', static::ALERT_KEY_PREFIX, $cameraId, $storeId);

        return Cache::has($key);
    }

    /**
     * Mark existing alert as "firing" again and refresh last_fired_at timestamp.
     */
    protected function notifyExistingAlert(Camera $camera, CameraHealthCheck $check): void
    {
        $alert = CameraAlert::active()
            ->where('camera_id', $camera->id)
            ->first();

        if (! $alert) {
            return; // Safeguard: alert should exist
        }

        $alert->increment('failure_count');
        $alert->update(['last_fired_at' => now()]);
    }

    /**
     * Create new alert with appropriate metadata.
     */
    protected function createAlert(Camera $camera, CameraHealthCheck $check): void
    {
        $failureCount = 1;

        // Determine alert level based on recent history
        $recentFailures = CameraHealthCheck::recent($camera->id)
            ->byResult('failure')
            ->where('probed_at', '>=', now()->subHours(2))
            ->count();

        $level = $recentFailures >= 3 ? 'critical' : 'warning';
        $type = $level === 'critical' ? 'offline' : 'unstable_connection';

        // Generate summary based on level and type
        $summary = $level === 'critical'
            ? "Kamera {$camera->name} ({$camera->code}) dalam kondisi PINGGIRAN (offline). Catat aktivitas teknis untuk ditinjau."
            : "Kamera {$camera->name} ({$camera->code}) pengalami SINKRONISASI tidak stabil. Mull control timeout request.";

        CameraAlert::create([
            'level' => $level,
            'camera_id' => $camera->id,
            'store_id' => $camera->store_id,
            'type' => $type,
            'summary' => $summary,
            'failure_count' => $failureCount,
            'first_fired_at' => now(),
            'last_fired_at' => now(),
            'created_by' => null, // Auto-generated
        ]);

        // Set cache key to prevent further alert duplication for this event window
        $key = sprintf('%s:%d:%d', static::ALERT_KEY_PREFIX, $camera->id, $camera->store_id);
        Cache::put($key, $camera->code, now()->addHours(static::ALERT_WINDOW_HOURS));
    }

    /**
     * Detect recovery events from successful health checks.
     */
    public function detectRecovery(Camera $camera): ?CameraAlert
    {
        $activeAlert = CameraAlert::active()
            ->where('camera_id', $camera->id)
            ->latest('first_fired_at')
            ->first();

        if (! $activeAlert) {
            return null;
        }

        // Check if there's a recent success (within last 1 minute)
        $recentSuccess = CameraHealthCheck::recent($camera->id)
            ->byResult('success')
            ->where('probed_at', '>=', now()->subMinutes(5))
            ->exists();

        if ($recentSuccess) {
            $this->resolveAlert($camera, $activeAlert);

            return $activeAlert;
        }

        return null;
    }

    /**
     * Mark alert as resolved and trigger recovery notification.
     */
    protected function resolveAlert(Camera $camera, CameraAlert $alert): void
    {
        $alert->markAsResolved();

        Log::info("CameraAlertService: Recovered alert for camera {$camera->code} ({$camera->name}).");

        // TODO: Optional: Send admin notification email
    }
}
