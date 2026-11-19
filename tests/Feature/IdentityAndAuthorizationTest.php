<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Store;
use App\Models\User;
use App\RoleSlug;
use App\UserStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IdentityAndAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $gm;

    protected User $sv;

    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->admin = User::where('email', 'admin@osave.id')->firstOrFail();
        $this->gm = User::where('email', 'gm@osave.id')->firstOrFail();
        $this->sv = User::where('email', 'sv.kemang@osave.id')->firstOrFail();
        $this->staff = User::where('email', 'staff@osave.id')->firstOrFail();
    }

    public function test_master_admin_can_access_users_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/users');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.data')
            ->has('roles')
            ->has('stores')
        );
    }

    public function test_non_master_admin_cannot_access_users_management(): void
    {
        $response = $this->actingAs($this->gm)->get('/admin/users');
        $response->assertForbidden();

        $responseSv = $this->actingAs($this->sv)->get('/admin/users');
        $responseSv->assertForbidden();

        $responseStaff = $this->actingAs($this->staff)->get('/admin/users');
        $responseStaff->assertForbidden();
    }

    public function test_master_admin_can_create_user_with_store_scope(): void
    {
        $svRole = Role::where('slug', RoleSlug::Sv->value)->firstOrFail();
        $stores = Store::take(2)->get();

        $response = $this->actingAs($this->admin)->post('/admin/users', [
            'name' => 'New Supervisor Demo',
            'email' => 'new.sv@osave.id',
            'password' => 'Password123!',
            'role_id' => $svRole->id,
            'status' => UserStatus::Active->value,
            'assigned_store_ids' => $stores->pluck('id')->all(),
        ]);

        $response->assertRedirect('/admin/users');

        $newUser = User::where('email', 'new.sv@osave.id')->firstOrFail();
        $this->assertSame('New Supervisor Demo', $newUser->name);
        $this->assertCount(2, $newUser->assignedStores);

        // Verify audit log entry was written
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'user.created',
            'subject_id' => $newUser->id,
        ]);
    }

    public function test_master_admin_cannot_deactivate_themselves(): void
    {
        $response = $this->actingAs($this->admin)->delete("/admin/users/{$this->admin->id}");

        $response->assertSessionHas('error');
        $this->assertSame(UserStatus::Active->value, $this->admin->fresh()->status);
    }

    public function test_master_admin_can_deactivate_other_user(): void
    {
        $response = $this->actingAs($this->admin)->delete("/admin/users/{$this->staff->id}");

        $response->assertRedirect('/admin/users');
        $this->assertSame(UserStatus::Inactive->value, $this->staff->fresh()->status);

        // Verify audit log
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'user.deactivated',
            'subject_id' => $this->staff->id,
        ]);
    }

    public function test_permission_override_grant_and_deny_works_correctly(): void
    {
        $perm = Permission::where('slug', 'monitoring.view')->firstOrFail();

        // 1. Staff initially has no permissions
        $this->assertFalse($this->staff->hasPermission('monitoring.view'));

        // 2. Grant override to staff
        $response = $this->actingAs($this->admin)->post("/admin/users/{$this->staff->id}/permissions", [
            'overrides' => [
                [
                    'permission_id' => $perm->id,
                    'effect' => 'grant',
                    'reason' => 'Khusus pengujian akses',
                ],
            ],
        ]);

        $response->assertRedirect('/admin/users');
        $this->assertTrue($this->staff->fresh()->hasPermission('monitoring.view'));

        // 3. Deny override to SV (who normally has monitoring.view)
        $this->assertTrue($this->sv->hasPermission('monitoring.view'));

        $this->actingAs($this->admin)->post("/admin/users/{$this->sv->id}/permissions", [
            'overrides' => [
                [
                    'permission_id' => $perm->id,
                    'effect' => 'deny',
                    'reason' => 'Akses dicabut sementara',
                ],
            ],
        ]);

        $this->assertFalse($this->sv->fresh()->hasPermission('monitoring.view'));
    }

    public function test_staff_role_permission_template_can_be_updated(): void
    {
        $staffRole = Role::where('slug', RoleSlug::Staff->value)->firstOrFail();
        $perm = Permission::where('slug', 'monitoring.view')->firstOrFail();

        $response = $this->actingAs($this->admin)->put("/admin/roles-permissions/{$staffRole->id}", [
            'permission_ids' => [$perm->id],
        ]);

        $response->assertRedirect('/admin/roles-permissions');
        $this->assertTrue($staffRole->fresh()->permissions()->where('slug', 'monitoring.view')->exists());
    }

    public function test_master_admin_permissions_cannot_be_modified(): void
    {
        $adminRole = Role::where('slug', RoleSlug::MasterAdmin->value)->firstOrFail();

        $response = $this->actingAs($this->admin)->put("/admin/roles-permissions/{$adminRole->id}", [
            'permission_ids' => [],
        ]);

        $response->assertSessionHas('error');
    }

    public function test_roles_permissions_prerequisite_for_all_admin_operations(): void
    {
        // Verify basic role ownership
        $this->admin->refresh();
        $this->assertTrue($this->admin->role !== null);
    }
    // Low-priority: Activities (optional backend tracking)
    // TODO: Later: Add ActivityLogController route in auth routes if needed
}
