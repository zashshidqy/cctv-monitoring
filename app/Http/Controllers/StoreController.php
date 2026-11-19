<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Display a listing of stores for administration.
     */
    public function index(Request $request): Response
    {
        $query = Store::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $stores = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('admin/stores/index', [
            'stores' => $stores->through(fn (Store $store) => [
                'id' => $store->id,
                'code' => $store->code,
                'name' => $store->name,
                'address' => $store->address,
                'city' => $store->city,
                'region' => $store->region,
                'postalCode' => $store->postal_code,
                'latitude' => (float) $store->latitude,
                'longitude' => (float) $store->longitude,
                'status' => $store->status,
                'notes' => $store->notes,
                'deactivatedAt' => $store->deactivated_at?->toIso8601String(),
                'createdAt' => $store->created_at->toIso8601String(),
            ]),
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', ''),
            ],
        ]);
    }

    /**
     * Store a newly created store.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:stores,code'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'city' => ['required', 'string', 'max:100'],
            'region' => ['required', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'status' => ['required', 'in:active,inactive'],
            'notes' => ['nullable', 'string'],
        ]);

        $store = Store::create($validated);

        $this->auditService->log(
            action: 'store.created',
            subjectType: Store::class,
            subjectId: $store->id,
            metadata: [
                'code' => $store->code,
                'name' => $store->name,
                'city' => $store->city,
            ]
        );

        return redirect()->route('admin.stores.index')
            ->with('success', "Store {$store->name} ({$store->code}) berhasil ditambahkan.");
    }

    /**
     * Update the specified store.
     */
    public function update(Request $request, Store $store): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('stores')->ignore($store->id)],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'city' => ['required', 'string', 'max:100'],
            'region' => ['required', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'status' => ['required', 'in:active,inactive'],
            'notes' => ['nullable', 'string'],
        ]);

        $oldStatus = $store->status;
        $store->update($validated);

        // If status changed to inactive, set deactivated_at
        if ($oldStatus === 'active' && $validated['status'] === 'inactive') {
            $store->update(['deactivated_at' => now()]);
        } elseif ($oldStatus === 'inactive' && $validated['status'] === 'active') {
            $store->update(['deactivated_at' => null]);
        }

        $this->auditService->log(
            action: 'store.updated',
            subjectType: Store::class,
            subjectId: $store->id,
            metadata: [
                'code' => $store->code,
                'name' => $store->name,
                'status' => $store->status,
            ]
        );

        return redirect()->route('admin.stores.index')
            ->with('success', "Store {$store->name} berhasil diperbarui.");
    }

    /**
     * Soft deactivation of a store.
     */
    public function destroy(Store $store): RedirectResponse
    {
        $store->update([
            'status' => 'inactive',
            'deactivated_at' => now(),
        ]);

        $this->auditService->log(
            action: 'store.deactivated',
            subjectType: Store::class,
            subjectId: $store->id,
            metadata: [
                'code' => $store->code,
                'name' => $store->name,
            ]
        );

        return redirect()->route('admin.stores.index')
            ->with('success', "Store {$store->name} dinonaktifkan.");
    }
}
