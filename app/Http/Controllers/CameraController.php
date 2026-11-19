<?php

namespace App\Http\Controllers;

use App\CameraStatus;
use App\Models\Camera;
use App\Models\CameraSource;
use App\Models\Store;
use App\Services\AuditService;
use App\Services\CameraAdapters\CameraAdapterManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CameraController extends Controller
{
    public function __construct(
        protected CameraAdapterManager $adapterManager,
        protected AuditService $auditService
    ) {}

    /**
     * Display a listing of cameras.
     */
    public function index(Request $request): Response
    {
        $query = Camera::with(['store', 'primarySource']);

        if ($storeId = $request->query('store_id')) {
            $query->where('store_id', $storeId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($connType = $request->query('connection_type')) {
            $query->where('connection_type', $connType);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('area_label', 'like', "%{$search}%");
            });
        }

        $cameras = $query->latest()->paginate(15)->withQueryString();
        $stores = Store::active()->select('id', 'code', 'name', 'city')->get();

        return Inertia::render('admin/cameras/index', [
            'cameras' => $cameras->through(fn (Camera $cam) => [
                'id' => $cam->id,
                'code' => $cam->code,
                'name' => $cam->name,
                'areaLabel' => $cam->area_label,
                'channelNumber' => $cam->channel_number,
                'deviceType' => $cam->device_type,
                'connectionType' => $cam->connection_type,
                'status' => $cam->status,
                'isActive' => $cam->is_active,
                'store' => [
                    'id' => $cam->store->id,
                    'code' => $cam->store->code,
                    'name' => $cam->store->name,
                    'city' => $cam->store->city,
                ],
                'sanitizedSource' => $cam->primarySource?->getSanitizedConfig(),
                'lastCheckedAt' => $cam->last_checked_at?->toIso8601String(),
                'createdAt' => $cam->created_at->toIso8601String(),
            ]),
            'filters' => [
                'search' => $request->query('search', ''),
                'store_id' => $request->query('store_id', ''),
                'status' => $request->query('status', ''),
                'connection_type' => $request->query('connection_type', ''),
            ],
            'stores' => $stores,
        ]);
    }

    /**
     * Store a newly registered camera and encrypted source credentials.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_id' => ['required', 'exists:stores,id'],
            'code' => ['required', 'string', 'max:50', 'unique:cameras,code'],
            'name' => ['required', 'string', 'max:255'],
            'area_label' => ['required', 'string', 'max:100'],
            'channel_number' => ['nullable', 'integer', 'min:1', 'max:256'],
            'device_type' => ['required', 'in:ip_camera,nvr_channel,dvr_channel,other'],
            'connection_type' => ['required', 'in:onvif,rtsp,hls,webrtc,mjpeg,snapshot,vendor,custom'],
            'status' => ['required', Rule::enum(CameraStatus::class)],
            // Source configuration fields
            'source_config' => ['required', 'array'],
        ]);

        $camera = Camera::create([
            'store_id' => $validated['store_id'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'area_label' => $validated['area_label'],
            'channel_number' => $validated['channel_number'] ?? null,
            'device_type' => $validated['device_type'],
            'connection_type' => $validated['connection_type'],
            'status' => $validated['status'],
            'is_active' => true,
        ]);

        // Save encrypted source credentials
        CameraSource::create([
            'camera_id' => $camera->id,
            'source_kind' => $validated['connection_type'],
            'source_config_encrypted' => $validated['source_config'],
            'is_primary' => true,
            'is_active' => true,
            'created_by' => auth()->id(),
        ]);

        $this->auditService->log(
            action: 'camera.created',
            subjectType: Camera::class,
            subjectId: $camera->id,
            metadata: [
                'code' => $camera->code,
                'name' => $camera->name,
                'store_id' => $camera->store_id,
                'connection_type' => $camera->connection_type,
            ]
        );

        return redirect()->route('admin.cameras.index')
            ->with('success', "Kamera {$camera->name} ({$camera->code}) berhasil didaftarkan.");
    }

    /**
     * Update camera metadata and optionally source settings.
     */
    public function update(Request $request, Camera $camera): RedirectResponse
    {
        $validated = $request->validate([
            'store_id' => ['required', 'exists:stores,id'],
            'code' => ['required', 'string', 'max:50', Rule::unique('cameras')->ignore($camera->id)],
            'name' => ['required', 'string', 'max:255'],
            'area_label' => ['required', 'string', 'max:100'],
            'channel_number' => ['nullable', 'integer', 'min:1', 'max:256'],
            'device_type' => ['required', 'in:ip_camera,nvr_channel,dvr_channel,other'],
            'connection_type' => ['required', 'in:onvif,rtsp,hls,webrtc,mjpeg,snapshot,vendor,custom'],
            'status' => ['required', Rule::enum(CameraStatus::class)],
            'source_config' => ['nullable', 'array'],
        ]);

        $camera->update([
            'store_id' => $validated['store_id'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'area_label' => $validated['area_label'],
            'channel_number' => $validated['channel_number'] ?? null,
            'device_type' => $validated['device_type'],
            'connection_type' => $validated['connection_type'],
            'status' => $validated['status'],
        ]);

        // Update primary source if config passed
        if (! empty($validated['source_config'])) {
            $source = $camera->primarySource;
            if ($source) {
                // If password was empty, preserve existing encrypted password
                $existing = $source->source_config_encrypted ?? [];
                $newConfig = $validated['source_config'];
                if (empty($newConfig['password']) && ! empty($existing['password'])) {
                    $newConfig['password'] = $existing['password'];
                }

                $source->update([
                    'source_kind' => $validated['connection_type'],
                    'source_config_encrypted' => $newConfig,
                ]);
            } else {
                CameraSource::create([
                    'camera_id' => $camera->id,
                    'source_kind' => $validated['connection_type'],
                    'source_config_encrypted' => $validated['source_config'],
                    'is_primary' => true,
                    'is_active' => true,
                    'created_by' => auth()->id(),
                ]);
            }
        }

        $this->auditService->log(
            action: 'camera.updated',
            subjectType: Camera::class,
            subjectId: $camera->id,
            metadata: [
                'code' => $camera->code,
                'name' => $camera->name,
                'status' => $camera->status,
            ]
        );

        return redirect()->route('admin.cameras.index')
            ->with('success', "Kamera {$camera->name} berhasil diperbarui.");
    }

    /**
     * Soft deactivation of camera.
     */
    public function destroy(Camera $camera): RedirectResponse
    {
        $camera->update([
            'is_active' => false,
            'status' => CameraStatus::Offline->value,
            'deactivated_at' => now(),
        ]);

        $this->auditService->log(
            action: 'camera.deactivated',
            subjectType: Camera::class,
            subjectId: $camera->id,
            metadata: ['code' => $camera->code]
        );

        return redirect()->route('admin.cameras.index')
            ->with('success', "Kamera {$camera->name} dinonaktifkan.");
    }

    /**
     * Server-side test connection probe (SSRF-protected, sanitized response).
     */
    public function testConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connection_type' => ['required', 'string'],
            'config' => ['required', 'array'],
        ]);

        $adapter = $this->adapterManager->getAdapter($validated['connection_type']);
        $result = $adapter->testConnection($validated['config']);

        return response()->json($result);
    }
}
