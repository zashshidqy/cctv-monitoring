<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Store;
use App\Models\User;
use App\Services\AuditService;
use App\Services\AuthorizationService;
use App\UserStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        protected AuthorizationService $authService,
        protected AuditService $auditService
    ) {}

    /**
     * Display a listing of users with roles, status, and assigned store scope.
     */
    public function index(Request $request): Response
    {
        $query = User::with(['role', 'assignedStores']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->query('role')) {
            $query->whereHas('role', fn ($q) => $q->where('slug', $role));
        }

        $users = $query->latest()->paginate(15)->withQueryString();

        $roles = Role::select('id', 'name', 'slug')->get();
        $stores = Store::active()->select('id', 'code', 'name', 'city')->get();

        return Inertia::render('admin/users/index', [
            'users' => $users->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug,
                ] : null,
                'assignedStores' => $user->assignedStores->map(fn (Store $s) => [
                    'id' => $s->id,
                    'code' => $s->code,
                    'name' => $s->name,
                ]),
                'lastLoginAt' => $user->last_login_at?->toIso8601String(),
                'createdAt' => $user->created_at->toIso8601String(),
            ]),
            'filters' => [
                'search' => $request->query('search', ''),
                'role' => $request->query('role', ''),
            ],
            'roles' => $roles,
            'stores' => $stores,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'exists:roles,id'],
            'status' => ['required', Rule::enum(UserStatus::class)],
            'assigned_store_ids' => ['nullable', 'array'],
            'assigned_store_ids.*' => ['exists:stores,id'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'status' => $validated['status'],
        ]);

        if (! empty($validated['assigned_store_ids'])) {
            $this->authService->syncStoreScope($user, $validated['assigned_store_ids']);
        }

        $this->auditService->log(
            action: 'user.created',
            subjectType: User::class,
            subjectId: $user->id,
            metadata: [
                'email' => $user->email,
                'role_id' => $user->role_id,
                'status' => $user->status,
            ]
        );

        return redirect()->route('admin.users.index')
            ->with('success', "Pengguna {$user->name} berhasil ditambahkan.");
    }

    /**
     * Update user details, role, status, and store scope.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role_id' => ['required', 'exists:roles,id'],
            'status' => ['required', Rule::enum(UserStatus::class)],
            'assigned_store_ids' => ['nullable', 'array'],
            'assigned_store_ids.*' => ['exists:stores,id'],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
            'status' => $validated['status'],
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Sync store assignments
        $this->authService->syncStoreScope($user, $validated['assigned_store_ids'] ?? []);

        $this->auditService->log(
            action: 'user.updated',
            subjectType: User::class,
            subjectId: $user->id,
            metadata: [
                'email' => $user->email,
                'role_id' => $user->role_id,
                'status' => $user->status,
            ]
        );

        return redirect()->route('admin.users.index')
            ->with('success', "Pengguna {$user->name} berhasil diperbarui.");
    }

    /**
     * Deactivate or lock a user account.
     */
    public function destroy(User $user): RedirectResponse
    {
        // Prevent deleting oneself
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun sendiri.');
        }

        // Soft deactivation (do not hard-delete per security rules)
        $user->update(['status' => UserStatus::Inactive->value]);

        $this->auditService->log(
            action: 'user.deactivated',
            subjectType: User::class,
            subjectId: $user->id,
            metadata: ['email' => $user->email]
        );

        return redirect()->route('admin.users.index')
            ->with('success', "Pengguna {$user->name} dinonaktifkan.");
    }

    /**
     * Show effective permissions and override editor for a specific user.
     */
    public function permissions(User $user): Response
    {
        $user->load(['role.permissions']);

        $allPermissions = Permission::orderBy('module')->orderBy('name')->get();

        // Get custom overrides
        $overrides = \DB::table('user_permissions')
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('permission_id');

        $effectiveSlugs = $user->getPermissionSlugs();

        $permissionsByModule = $allPermissions->groupBy('module')->map(function ($perms) use ($user, $overrides, $effectiveSlugs) {
            return $perms->map(function ($perm) use ($user, $overrides, $effectiveSlugs) {
                $override = $overrides->get($perm->id);
                $isRoleDefault = $user->role?->permissions->contains('id', $perm->id) ?? false;
                $isEffective = in_array($perm->slug, $effectiveSlugs, true);

                return [
                    'id' => $perm->id,
                    'name' => $perm->name,
                    'slug' => $perm->slug,
                    'description' => $perm->description,
                    'isRoleDefault' => $isRoleDefault,
                    'override' => $override ? $override->effect : null, // 'grant' | 'deny' | null
                    'isEffective' => $isEffective,
                ];
            });
        });

        return Inertia::render('admin/users/permissions', [
            'targetUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->name,
                'roleSlug' => $user->role?->slug,
            ],
            'permissionsByModule' => $permissionsByModule,
        ]);
    }

    /**
     * Save permission overrides for a user.
     */
    public function updatePermissions(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'overrides' => ['required', 'array'],
            'overrides.*.permission_id' => ['required', 'exists:permissions,id'],
            'overrides.*.effect' => ['nullable', 'in:grant,deny,none'],
            'overrides.*.reason' => ['nullable', 'string', 'max:255'],
        ]);

        foreach ($validated['overrides'] as $item) {
            $permId = (int) $item['permission_id'];
            $effect = $item['effect'] ?? 'none';

            if ($effect === 'none' || empty($effect)) {
                $this->authService->removePermissionOverride($user, $permId);
            } else {
                $this->authService->setPermissionOverride(
                    user: $user,
                    permissionId: $permId,
                    effect: $effect,
                    reason: $item['reason'] ?? null
                );
            }
        }

        return redirect()->route('admin.users.index')
            ->with('success', "Izin khusus untuk {$user->name} berhasil diperbarui.");
    }
}
