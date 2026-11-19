<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RbacAndStoreScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_unauthenticated_user_is_redirected_to_login(): void
    {
        $response = $this->get('/monitoring');

        $response->assertRedirect('/login');
    }

    public function test_master_admin_has_global_store_scope(): void
    {
        $admin = User::where('email', 'admin@osave.id')->firstOrFail();

        $this->assertTrue($admin->isMasterAdmin());
        $this->assertNull($admin->getStoreScopeIds()); // null = global access
        $this->assertTrue($admin->hasPermission('monitoring.view'));
        $this->assertTrue($admin->hasPermission('stores.create'));
    }

    public function test_general_manager_has_global_scope_but_no_admin_mutations(): void
    {
        $gm = User::where('email', 'gm@osave.id')->firstOrFail();

        $this->assertTrue($gm->isGm());
        $this->assertNull($gm->getStoreScopeIds()); // null = global scope
        $this->assertTrue($gm->hasPermission('monitoring.view'));
        $this->assertTrue($gm->hasPermission('cameras.live_view'));

        // GM must not have admin mutation permissions
        $this->assertFalse($gm->hasPermission('stores.create'));
        $this->assertFalse($gm->hasPermission('users.create'));
    }

    public function test_supervisor_has_assigned_store_scope_only(): void
    {
        $sv = User::where('email', 'sv.kemang@osave.id')->firstOrFail();

        $this->assertTrue($sv->isSv());
        $scope = $sv->getStoreScopeIds();

        $this->assertIsArray($scope);
        $this->assertCount(1, $scope);

        // Can access Kemang (assigned)
        $kemang = Store::where('code', 'DEMO-JKT-01')->firstOrFail();
        $this->assertTrue($sv->canAccessStore($kemang));

        // CANNOT access Tebet (not assigned)
        $tebet = Store::where('code', 'DEMO-JKT-02')->firstOrFail();
        $this->assertFalse($sv->canAccessStore($tebet));
    }

    public function test_staff_has_zero_operational_permissions_by_default(): void
    {
        $staff = User::where('email', 'staff@osave.id')->firstOrFail();

        $this->assertTrue($staff->isStaff());
        $this->assertEmpty($staff->getPermissionSlugs());
        $this->assertFalse($staff->hasPermission('monitoring.view'));
        $this->assertFalse($staff->hasPermission('cameras.live_view'));
    }

    public function test_staff_without_monitoring_permission_sees_restricted_screen(): void
    {
        $staff = User::where('email', 'staff@osave.id')->firstOrFail();

        $response = $this->actingAs($staff)->get('/monitoring');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('monitoring/restricted')
            ->has('message')
        );
    }

    public function test_sv_geojson_endpoint_returns_only_assigned_stores(): void
    {
        $sv = User::where('email', 'sv.kemang@osave.id')->firstOrFail();

        $response = $this->actingAs($sv)->getJson('/monitoring/stores/geojson');

        $response->assertOk();
        $response->assertJsonStructure([
            'type',
            'features' => [
                '*' => [
                    'type',
                    'geometry' => ['type', 'coordinates'],
                    'properties' => ['id', 'code', 'name', 'markerStatus'],
                ],
            ],
        ]);

        // SV only has 1 store assigned
        $features = $response->json('features');
        $this->assertCount(1, $features);
        $this->assertSame('DEMO-JKT-01', $features[0]['properties']['code']);
    }

    public function test_gm_geojson_endpoint_returns_all_stores(): void
    {
        $gm = User::where('email', 'gm@osave.id')->firstOrFail();

        $response = $this->actingAs($gm)->getJson('/monitoring/stores/geojson');

        $response->assertOk();
        $features = $response->json('features');

        // All 4 demo stores returned
        $this->assertCount(4, $features);
    }

    public function test_non_master_admin_cannot_access_admin_panel(): void
    {
        $gm = User::where('email', 'gm@osave.id')->firstOrFail();

        $response = $this->actingAs($gm)->get('/admin');

        $response->assertForbidden();
    }

    public function test_master_admin_can_access_admin_panel(): void
    {
        $admin = User::where('email', 'admin@osave.id')->firstOrFail();

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('admin/overview'));
    }
}
