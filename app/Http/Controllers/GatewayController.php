<?php

namespace App\Http\Controllers;

use App\Models\Gateway;
use App\Models\Store;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GatewayController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Display a listing of media gateways.
     */
    public function index(Request $request): Response
    {
        $query = Gateway::with(['store'])->withCount('cameras');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('host', 'like', "%{$search}%");
            });
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($storeId = $request->query('store_id')) {
            $query->where('store_id', $storeId);
        }

        $gateways = $query->latest()->paginate(15)->withQueryString();

        $stores = Store::active()->orderBy('name')->get(['id', 'code', 'name', 'city']);

        $stats = [
            'total' => Gateway::count(),
            'online' => Gateway::where('status', 'online')->count(),
            'offline' => Gateway::where('status', 'offline')->count(),
            'degraded' => Gateway::where('status', 'degraded')->count(),
        ];

        return Inertia::render('admin/gateways/index', [
            'gateways' => $gateways->through(fn (Gateway $gateway) => [
                'id' => $gateway->id,
                'code' => $gateway->code,
                'name' => $gateway->name,
                'type' => $gateway->type,
                'storeId' => $gateway->store_id,
                'store' => $gateway->store ? [
                    'id' => $gateway->store->id,
                    'code' => $gateway->store->code,
                    'name' => $gateway->store->name,
                    'city' => $gateway->store->city,
                ] : null,
                'host' => $gateway->host,
                'port' => $gateway->port,
                'status' => $gateway->status,
                'version' => $gateway->version,
                'cameraCount' => $gateway->cameras_count ?? 0,
                'lastHeartbeatAt' => $gateway->last_heartbeat_at?->toIso8601String(),
                'notes' => $gateway->notes,
                'createdAt' => $gateway->created_at->toIso8601String(),
            ]),
            'stores' => $stores,
            'filters' => [
                'search' => $request->query('search', ''),
                'type' => $request->query('type', ''),
                'status' => $request->query('status', ''),
                'store_id' => $request->query('store_id', ''),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created gateway node.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:gateways,code'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:central,edge'],
            'store_id' => ['nullable', 'required_if:type,edge', 'exists:stores,id'],
            'host' => ['nullable', 'string', 'max:255'],
            'port' => ['nullable', 'integer', 'between:1,65535'],
            'status' => ['required', 'in:online,offline,degraded'],
            'version' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ]);

        if (($validated['type'] ?? '') === 'central') {
            $validated['store_id'] = null;
        }

        $validated['last_heartbeat_at'] = now();

        $gateway = Gateway::create($validated);

        $this->auditService->log(
            action: 'gateway.created',
            subjectType: Gateway::class,
            subjectId: $gateway->id,
            metadata: [
                'code' => $gateway->code,
                'name' => $gateway->name,
                'type' => $gateway->type,
                'status' => $gateway->status,
            ]
        );

        return redirect()->route('admin.gateways.index')
            ->with('success', "Media Gateway {$gateway->name} ({$gateway->code}) berhasil ditambahkan.");
    }

    /**
     * Update the specified gateway.
     */
    public function update(Request $request, Gateway $gateway): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('gateways')->ignore($gateway->id)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:central,edge'],
            'store_id' => ['nullable', 'required_if:type,edge', 'exists:stores,id'],
            'host' => ['nullable', 'string', 'max:255'],
            'port' => ['nullable', 'integer', 'between:1,65535'],
            'status' => ['required', 'in:online,offline,degraded'],
            'version' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ]);

        if (($validated['type'] ?? '') === 'central') {
            $validated['store_id'] = null;
        }

        $gateway->update($validated);

        $this->auditService->log(
            action: 'gateway.updated',
            subjectType: Gateway::class,
            subjectId: $gateway->id,
            metadata: [
                'code' => $gateway->code,
                'name' => $gateway->name,
                'type' => $gateway->type,
                'status' => $gateway->status,
            ]
        );

        return redirect()->route('admin.gateways.index')
            ->with('success', "Media Gateway {$gateway->name} berhasil diperbarui.");
    }

    /**
     * Remove the specified gateway.
     */
    public function destroy(Gateway $gateway): RedirectResponse
    {
        $this->auditService->log(
            action: 'gateway.deleted',
            subjectType: Gateway::class,
            subjectId: $gateway->id,
            metadata: [
                'code' => $gateway->code,
                'name' => $gateway->name,
            ]
        );

        $gateway->delete();

        return redirect()->route('admin.gateways.index')
            ->with('success', "Gateway {$gateway->name} berhasil dihapus.");
    }

    /**
     * Send heartbeat/ping to gateway node.
     */
    public function ping(Gateway $gateway): JsonResponse
    {
        $gateway->update([
            'last_heartbeat_at' => now(),
            'status' => 'online',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Heartbeat gateway {$gateway->code} berhasil diterima.",
            'last_heartbeat_at' => $gateway->last_heartbeat_at->toIso8601String(),
        ]);
    }
}
