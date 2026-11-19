<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Store;
use App\Models\StoreUserAssignment;
use App\Models\User;

class AuthorizationService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Compute effective permissions for a user taking into account
     * role permissions, user overrides, and system status.
     *
     * @return string[]
     */
    public function getEffectivePermissions(User $user): array
    {
        return $user->getPermissionSlugs();
    }

    /**
     * Assign a role to a user and audit the action.
     */
    public function assignRole(User $user, int $roleId, ?User $actor = null): void
    {
        $oldRoleId = $user->role_id;
        $user->update(['role_id' => $roleId]);

        $this->auditService->log(
            action: 'user.role_assigned',
            actor: $actor,
            subjectType: User::class,
            subjectId: $user->id,
            metadata: [
                'user_email' => $user->email,
                'old_role_id' => $oldRoleId,
                'new_role_id' => $roleId,
            ]
        );
    }

    /**
     * Sync store assignments for SV or Staff.
     *
     * @param  int[]  $storeIds
     */
    public function syncStoreScope(User $user, array $storeIds, ?User $actor = null): void
    {
        // Deactivate old assignments not in the new list
        StoreUserAssignment::where('user_id', $user->id)
            ->whereNotIn('store_id', $storeIds)
            ->delete();

        // Add or re-activate new assignments
        foreach ($storeIds as $storeId) {
            StoreUserAssignment::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'store_id' => $storeId,
                ],
                [
                    'status' => 'active',
                    'assigned_by' => $actor?->id ?? auth()->id(),
                    'starts_at' => now(),
                ]
            );
        }

        $this->auditService->log(
            action: 'user.store_scope_synced',
            actor: $actor,
            subjectType: User::class,
            subjectId: $user->id,
            metadata: [
                'user_email' => $user->email,
                'assigned_store_ids' => $storeIds,
            ]
        );
    }

    /**
     * Set a custom permission override for a user.
     * Effect: 'grant' or 'deny'.
     */
    public function setPermissionOverride(
        User $user,
        int $permissionId,
        string $effect,
        ?string $reason = null,
        ?User $actor = null
    ): void {
        \DB::table('user_permissions')->updateOrInsert(
            [
                'user_id' => $user->id,
                'permission_id' => $permissionId,
            ],
            [
                'effect' => $effect,
                'reason' => $reason,
                'created_by' => $actor?->id ?? auth()->id(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $permission = Permission::find($permissionId);

        $this->auditService->log(
            action: 'user.permission_override_set',
            actor: $actor,
            subjectType: User::class,
            subjectId: $user->id,
            metadata: [
                'user_email' => $user->email,
                'permission_slug' => $permission?->slug,
                'effect' => $effect,
                'reason' => $reason,
            ]
        );
    }

    /**
     * Remove a custom permission override.
     */
    public function removePermissionOverride(
        User $user,
        int $permissionId,
        ?User $actor = null
    ): void {
        \DB::table('user_permissions')
            ->where('user_id', $user->id)
            ->where('permission_id', $permissionId)
            ->delete();

        $this->auditService->log(
            action: 'user.permission_override_removed',
            actor: $actor,
            subjectType: User::class,
            subjectId: $user->id,
            metadata: [
                'user_email' => $user->email,
                'permission_id' => $permissionId,
            ]
        );
    }
}
