<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use App\Models\Store;
use App\Models\User;
use App\Services\StoreStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    public function __construct(
        protected StoreStatusService $statusService
    ) {}

    /**
     * Display the main map-first monitoring workspace.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        // Check if user has permission to view monitoring
        if (! $user->hasPermission('monitoring.view')) {
            return Inertia::render('monitoring/restricted', [
                'message' => 'Akun Anda belum memiliki izin untuk membuka halaman monitoring. Hubungi Master Admin untuk mendapatkan akses.',
            ]);
        }

        return Inertia::render('monitoring/index', [
            'tileConfig' => [
                'provider' => config('map.provider', 'osm'),
                'styleUrl' => config('map.style_url'),
                'attribution' => config('map.attribution', '© OpenStreetMap contributors'),
                'defaultCenter' => [106.8456, -6.2088], // Jakarta default center
                'defaultZoom' => 11,
                'maxPitch' => 20, // Strict design limit
            ],
        ]);
    }

    /**
     * Get authorized stores as GeoJSON FeatureCollection.
     * Enforces user store scope server-side — never sends unauthorized stores to client.
     */
    public function storesGeoJson(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->hasPermission('stores.view')) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []], 403);
        }

        $query = Store::query()->active();

        // Apply store scope
        $scope = $user->getStoreScopeIds();
        if ($scope !== null) {
            $query->whereIn('id', $scope);
        }

        // Search filter (code, name, city, region, address)
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('region', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        $stores = $query->get();

        $features = $stores->map(function (Store $store) {
            $health = $this->statusService->getStoreHealthSummary($store);

            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [(float) $store->longitude, (float) $store->latitude],
                ],
                'properties' => [
                    'id' => $store->id,
                    'code' => $store->code,
                    'name' => $store->name,
                    'city' => $store->city,
                    'region' => $store->region,
                    'address' => $store->address,
                    'markerStatus' => $health['markerStatus'],
                    'cameraTotal' => $health['cameraTotal'],
                    'cameraOnline' => $health['cameraOnline'],
                    'cameraUnstable' => $health['cameraUnstable'],
                    'cameraOffline' => $health['cameraOffline'],
                    'cameraUnknown' => $health['cameraUnknown'],
                ],
            ];
        });

        // Filter by markerStatus if specified
        if ($statusFilter = $request->query('status')) {
            $features = $features->filter(fn ($f) => $f['properties']['markerStatus'] === $statusFilter)->values();
        }

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features,
        ]);
    }

    /**
     * Get authorized list of active cameras for a given store.
     * Enforces store scope and permissions server-side.
     */
    public function storeCameras(Request $request, Store $store): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->hasPermission('cameras.view') && ! $user->hasPermission('monitoring.view')) {
            abort(403, 'Akses ditolak: Anda tidak memiliki izin untuk melihat daftar kamera.');
        }

        if (! $user->canAccessStore($store->id)) {
            abort(403, 'Akses ditolak: Store ini berada di luar cakupan wewenang Anda.');
        }

        $cameras = $store->cameras()
            ->active()
            ->orderBy('channel_number')
            ->orderBy('name')
            ->get();

        return response()->json([
            'store' => [
                'id' => $store->id,
                'code' => $store->code,
                'name' => $store->name,
                'city' => $store->city,
            ],
            'cameras' => $cameras->map(fn (Camera $cam) => [
                'id' => $cam->id,
                'storeId' => $cam->store_id,
                'code' => $cam->code,
                'name' => $cam->name,
                'areaLabel' => $cam->area_label,
                'channelNumber' => $cam->channel_number,
                'deviceType' => $cam->device_type,
                'connectionType' => $cam->connection_type,
                'status' => $cam->status,
                'isActive' => $cam->is_active,
                'lastCheckedAt' => $cam->last_checked_at?->toIso8601String(),
                'lastSuccessAt' => $cam->last_success_at?->toIso8601String(),
                'previewType' => 'snapshot',
                'snapshotUrl' => null,
                'snapshotTakenAt' => null,
                'isSelected' => false,
            ]),
        ]);
    }
}
