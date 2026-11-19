<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RolePermissionController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Display role catalog and permission matrix.
     */
    public function index(): Response
    {
        $roles = Role::with('permissions')->get()->map(fn (Role $r) => [
            'id' => $r->id,
            'name' => $r->name,
            'slug' => $r->slug,
            'description' => $r->description,
            'isSystemRole' => $r->is_system_role,
            'userCount' => $r->users()->count(),
            'permissionIds' => $r->permissions->pluck('id')->all(),
        ]);

        $permissions = Permission::orderBy('module')->orderBy('name')->get()->groupBy('module');

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'permissionsByModule' => $permissions,
        ]);
    }

    /**
     * Update permissions for a role (e.g. configuring Staff template).
     * Master Admin permissions cannot be removed to avoid lockout.
     */
    public function updateRolePermissions(Request $request, Role $role): RedirectResponse
    {
        if ($role->slug === 'master_admin') {
            return back()->with('error', 'Izin Master Admin tidak dapat diubah (proteksi sistem).');
        }

        $validated = $request->validate([
            'permission_ids' => ['present', 'array'],
            'permission_ids.*' => ['exists:permissions,id'],
        ]);

        $role->permissions()->sync($validated['permission_ids']);

        $this->auditService->log(
            action: 'role.permissions_updated',
            subjectType: Role::class,
            subjectId: $role->id,
            metadata: [
                'role_slug' => $role->slug,
                'permission_count' => count($validated['permission_ids']),
            ]
        );

        return redirect()->route('admin.roles.index')
            ->with('success', "Izin untuk peran {$role->name} berhasil diperbarui.");
    }
}
