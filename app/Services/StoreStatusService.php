<?php

namespace App\Services;

use App\MarkerStatus;
use App\Models\Store;

class StoreStatusService
{
    /**
     * Compute deterministic marker status and camera health breakdown for a store.
     * In Epic 3, uses deterministic store metadata or mock profile;
     * In Epic 4-6, reads from camera_health_checks and camera records.
     *
     * @return array{
     *     markerStatus: string,
     *     cameraTotal: int,
     *     cameraOnline: int,
     *     cameraUnstable: int,
     *     cameraOffline: int,
     *     cameraUnknown: int
     * }
     */
    public function getStoreHealthSummary(Store $store): array
    {
        // Deterministic profile based on store code for testability
        if (str_contains($store->code, 'BDG')) {
            // Bandung store: Partial (some camera offline)
            return [
                'markerStatus' => MarkerStatus::Partial->value,
                'cameraTotal' => 6,
                'cameraOnline' => 4,
                'cameraUnstable' => 1,
                'cameraOffline' => 1,
                'cameraUnknown' => 0,
            ];
        }

        if (str_contains($store->code, 'SBY')) {
            // Surabaya store: All offline
            return [
                'markerStatus' => MarkerStatus::Offline->value,
                'cameraTotal' => 4,
                'cameraOnline' => 0,
                'cameraUnstable' => 0,
                'cameraOffline' => 4,
                'cameraUnknown' => 0,
            ];
        }

        // Jakarta stores: All online
        return [
            'markerStatus' => MarkerStatus::Online->value,
            'cameraTotal' => 6,
            'cameraOnline' => 6,
            'cameraUnstable' => 0,
            'cameraOffline' => 0,
            'cameraUnknown' => 0,
        ];
    }
}
