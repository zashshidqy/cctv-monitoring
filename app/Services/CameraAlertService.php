<?php

namespace App\Services;

use App\Models\AlertPolicy;
use App\Models\CameraAlert;
use App\Models\CameraHealthCheck;
use App\Models\User;
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
     * Applies role-based alert policies for notification routing.
     */
    public function checkAndTriggerAlerts(): int
    {
        // Get all failed health checks from the last hour
        $failedChecks = CameraHealthCheck::recent(1)
            ->byResult('failure')
            ->with(['camera.store'])
            ->orderBy('probed_at', 'desc')
            ->get();

        $alertsTriggered = 0;

        foreach ($failedChecks as $check) {
            $camera = $check->camera;

            // Skip cameras that should be ignored
            if (! $camera?->is_active || ! $camera->store_id) {
                continue;
            }

            // Determine alert level and type based on failure pattern
            $recentFailures = CameraHealthCheck::recent($camera->id)
                ->byResult('failure')
                ->where('probed_at', '>=', now()->subHours(2))
                ->count();

            $level = $recentFailures >= 3 ? 'critical' : 'warning';
            $type = $level === 'critical' ? 'offline' : 'unstable_connection';

            // Check if alert should be created based on policy evaluation
            if (! $this->shouldCreateAlertForCamera($camera, $level, $type)) {
                continue;
            }

            // Check if alert already exists for this camera/store within alert window (deduplication)
            if ($this->alertExistsForCameraAndStore($camera->id, $camera->store_id, $check)) {
                // Update existing alert failure count
                $this->notifyExistingAlert($camera, $check);
            } else {
                // Create new alert
                $this->createAlert($camera, $check, $level, $type);
                $alertsTriggered++;
            }
        }

        Log::info("CameraAlertService: Checked {$failedChecks->count()} failed health checks. {$alertsTriggered} new alerts triggered.");

        return $alertsTriggered;
    }

    /**
     * Determine if an alert should be created for a camera based on role policies.
     * Returns true if at least one policy allows this alert level/type.
     */
    protected function shouldCreateAlertForCamera($camera, string $level, string $type): bool
    {
        // Get all users who have access to this store
        $users = User::whereHas('storeAssignments', function ($q) use ($camera) {
            $q->where('store_id', $camera->store_id);
        })->with('roles')->get();

        // Check if any user with access has a policy that allows this alert
        foreach ($users as $user) {
            $roles = $user->getRoleNames()->toArray();
            foreach ($roles as $role) {
                $policy = AlertPolicy::getForRole($role);
                if ($policy && $policy->allowsAlert($level, $type)) {
                    return true;
                }
            }
        }

        // Also check master_admin policy (global access)
        $masterPolicy = AlertPolicy::getForRole('master_admin');
        if ($masterPolicy && $masterPolicy->allowsAlert($level, $type)) {
            return true;
        }

        return false;
    }

    /**
     * Check if alert already exists (deduplication logic).
     * Uses configurable deduplication window from policy (default 5 minutes).
     */
    protected function alertExistsForCameraAndStore(int $cameraId, int $storeId, CameraHealthCheck $check): bool
    {
        // Get the minimum deduplication window across all policies
        $minDedupMinutes = AlertPolicy::enabled()->min('deduplication_minutes') ?? 5;
        $dedupKey = sprintf('%s:%d:%d', static::ALERT_KEY_PREFIX, $cameraId, $storeId);

        return Cache::has($dedupKey);
    }

    /**
     * Mark existing alert as "firing" again and refresh last_fired_at timestamp.
     */
    protected function notifyExistingAlert($camera, CameraHealthCheck $check): void
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
    protected function createAlert($camera, CameraHealthCheck $check, string $level, string $type): void
    {
        // Generate summary based on level and type
        $summary = $level === 'critical'
            ? "Kamera {$camera->name} ({$camera->code}) dalam kondisi OFFLINE. Catat aktivitas teknis untuk ditinjau."
            : "Kamera {$camera->name} ({$camera->code}) mengalami KONEKSI tidak stabil. Mohon cek jaringan.";

        CameraAlert::create([
            'level' => $level,
            'camera_id' => $camera->id,
            'store_id' => $camera->store_id,
            'type' => $type,
            'summary' => $summary,
            'failure_count' => 1,
            'first_fired_at' => now(),
            'last_fired_at' => now(),
            'created_by' => null, // Auto-generated
        ]);

        // Set cache key to prevent further alert duplication for this event window
        // Use the minimum deduplication window from policies
        $minDedupMinutes = AlertPolicy::enabled()->min('deduplication_minutes') ?? 5;
        $dedupKey = sprintf('%s:%d:%d', static::ALERT_KEY_PREFIX, $camera->id, $camera->store_id);
        Cache::put($dedupKey, $camera->code, now()->addMinutes($minDedupMinutes));

        Log::info("CameraAlertService: Created {$level} alert for camera {$camera->code} at store {$camera->store->code}");
    }

    /**
     * Detect recovery events from successful health checks.
     */
    public function detectRecovery($camera): ?CameraAlert
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
    protected function resolveAlert($camera, CameraAlert $alert): void
    {
        $alert->markAsResolved();

        Log::info("CameraAlertService: Recovered alert for camera {$camera->code} ({$camera->name}).");

        // Clear deduplication cache on recovery
        $dedupKey = sprintf('%s:%d:%d', static::ALERT_KEY_PREFIX, $camera->id, $camera->store_id);
        Cache::forget($dedupKey);
    }

    /**
     * Get alerts visible to a specific user based on their role policies and store scope.
     */
    public function getAlertsForUser(User $user, array $filters = []): array
    {
        $query = CameraAlert::query();

        // Apply store scope for non-master_admin
        if (! $user->hasRole('master_admin')) {
            $storeIds = $user->storeAssignments()->pluck('store_id');
            if ($storeIds->isNotEmpty()) {
                $query->whereIn('store_id', $storeIds);
            } else {
                // User has no store assignments - return empty
                return ['summary' => [], 'alerts' => []];
            }
        }

        // Apply role-based policy filtering
        $roles = $user->getRoleNames()->toArray();
        $allowedLevels = [];
        $allowedTypes = [];

        foreach ($roles as $role) {
            $policy = AlertPolicy::getForRole($role);
            if ($policy) {
                if ($policy->alert_level) {
                    $allowedLevels[] = $policy->alert_level;
                }
                if ($policy->allowed_types) {
                    $allowedTypes = array_merge($allowedTypes, $policy->allowed_types);
                }
            }
        }

        // Also consider master_admin policy
        $masterPolicy = AlertPolicy::getForRole('master_admin');
        if ($masterPolicy) {
            if ($masterPolicy->alert_level) {
                $allowedLevels[] = $masterPolicy->alert_level;
            }
            if ($masterPolicy->allowed_types) {
                $allowedTypes = array_merge($allowedTypes, $masterPolicy->allowed_types);
            }
        }

        // Remove duplicates
        $allowedLevels = array_unique($allowedLevels);
        $allowedTypes = array_unique($allowedTypes);

        // Apply level filter if policy restricts
        if (! empty($allowedLevels)) {
            $query->whereIn('level', $allowedLevels);
        }

        // Apply type filter if policy restricts
        if (! empty($allowedTypes)) {
            $query->whereIn('type', $allowedTypes);
        }

        // Apply additional filters
        if (! empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->where('is_resolved', false);
            } elseif ($filters['status'] === 'resolved') {
                $query->where('is_resolved', true);
            } elseif ($filters['status'] === 'pending') {
                $query->where('approval_status', 'pending');
            }
        }

        if (! empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['store_id'])) {
            $query->where('store_id', $filters['store_id']);
        }

        // Count by status
        $newCount = (clone $query)->where('is_resolved', false)
            ->where('first_fired_at', '>=', now()->subHours(self::ALERT_WINDOW_HOURS))
            ->count();

        $activeCount = (clone $query)->where('is_resolved', false)
            ->where('first_fired_at', '<', now()->subHours(self::ALERT_WINDOW_HOURS))
            ->count();

        $resolvedCount = (clone $query)->where('is_resolved', true)->count();

        // Fetch paginated alerts
        $perPage = $filters['per_page'] ?? 15;
        $alerts = $query->active()
            ->select('id', 'level', 'store_id', 'type', 'summary', 'failure_count', 'last_fired_at', 'approval_status')
            ->with(['store:id,name,code', 'camera:id,name,code,store_id'])
            ->orderBy('last_fired_at', 'desc')
            ->paginate($perPage)
            ->through(fn (CameraAlert $alert) => [
                'id' => $alert->id,
                'level' => $alert->level,
                'store' => [
                    'id' => $alert->store_id,
                    'name' => $alert->store->name,
                    'code' => $alert->store->code,
                ],
                'type' => $alert->type,
                'summary' => $alert->summary,
                'failure_count' => $alert->failure_count,
                'last_fired_at' => $alert->last_fired_at->toIso8601String(),
                'pending_approval' => $alert->approval_status === 'pending',
            ]);

        return [
            'summary' => [
                'new' => $newCount,
                'active' => $activeCount,
                'resolved' => $resolvedCount,
                'total' => $newCount + $activeCount + $resolvedCount,
            ],
            'alerts' => $alerts,
        ];
    }
}
