<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreManagementAndMapTest extends TestCase
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

    public function test_master_admin_can_view_store_management_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/stores');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/stores/index')
            ->has('stores.data')
            ->has('filters')
        );
    }

    public function test_non_master_admin_cannot_access_store_management(): void
    {
        $response = $this->actingAs($this->gm)->get('/admin/stores');
        $response->assertForbidden();

        $responseSv = $this->actingAs($this->sv)->get('/admin/stores');
        $responseSv->assertForbidden();

        $responseStaff = $this->actingAs($this->staff)->get('/admin/stores');
        $responseStaff->assertForbidden();
    }

    public function test_master_admin_can_create_new_store(): void
    {
        $payload = [
            'code' => 'DEMO-SMG-01',
            'name' => 'O!Save Pandanaran Semarang (DEMO)',
            'address' => 'Jl. Pandanaran No. 88, Mugassari, Semarang Selatan',
            'city' => 'Semarang',
            'region' => 'Jawa Tengah',
            'postal_code' => '50249',
            'latitude' => -6.9892,
            'longitude' => 110.4215,
            'status' => 'active',
            'notes' => 'DATA DEMO — Pengujian Epic 3',
        ];

        $response = $this->actingAs($this->admin)->post('/admin/stores', $payload);

        $response->assertRedirect('/admin/stores');
        $this->assertDatabaseHas('stores', [
            'code' => 'DEMO-SMG-01',
            'name' => 'O!Save Pandanaran Semarang (DEMO)',
            'city' => 'Semarang',
        ]);

        // Audit log created
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'store.created',
        ]);
    }

    public function test_store_creation_validates_coordinates_and_unique_code(): void
    {
        // 1. Duplicate code
        $existing = Store::firstOrFail();
        $response = $this->actingAs($this->admin)->post('/admin/stores', [
            'code' => $existing->code,
            'name' => 'Duplicate Store Test',
            'address' => 'Test Address',
            'city' => 'Jakarta',
            'region' => 'DKI Jakarta',
            'latitude' => -6.2,
            'longitude' => 106.8,
            'status' => 'active',
        ]);

        $response->assertSessionHasErrors('code');

        // 2. Invalid coordinates (lat > 90)
        $responseInvalidCoord = $this->actingAs($this->admin)->post('/admin/stores', [
            'code' => 'DEMO-INVALID-01',
            'name' => 'Invalid Coord Store',
            'address' => 'Test Address',
            'city' => 'Jakarta',
            'region' => 'DKI Jakarta',
            'latitude' => 120.5, // Invalid > 90
            'longitude' => 106.8,
            'status' => 'active',
        ]);

        $responseInvalidCoord->assertSessionHasErrors('latitude');
    }

    public function test_master_admin_can_update_store(): void
    {
        $store = Store::firstOrFail();

        $response = $this->actingAs($this->admin)->put("/admin/stores/{$store->id}", [
            'code' => $store->code,
            'name' => 'Updated Store Name (DEMO)',
            'address' => 'Updated Address',
            'city' => $store->city,
            'region' => $store->region,
            'postal_code' => $store->postal_code,
            'latitude' => -6.2800,
            'longitude' => 106.8200,
            'status' => 'active',
            'notes' => 'Catatan diperbarui',
        ]);

        $response->assertRedirect('/admin/stores');
        $this->assertSame('Updated Store Name (DEMO)', $store->fresh()->name);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'store.updated',
            'subject_id' => $store->id,
        ]);
    }

    public function test_master_admin_can_soft_deactivate_store(): void
    {
        $store = Store::where('status', 'active')->firstOrFail();

        $response = $this->actingAs($this->admin)->delete("/admin/stores/{$store->id}");

        $response->assertRedirect('/admin/stores');
        $fresh = $store->fresh();
        $this->assertSame('inactive', $fresh->status);
        $this->assertNotNull($fresh->deactivated_at);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'store.deactivated',
            'subject_id' => $store->id,
        ]);
    }

    public function test_deactivated_stores_are_excluded_from_monitoring_geojson(): void
    {
        // Deactivate one store
        $storeToDeactivate = Store::firstOrFail();
        $storeToDeactivate->update([
            'status' => 'inactive',
            'deactivated_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->getJson('/monitoring/stores/geojson');

        $response->assertOk();
        $features = $response->json('features');

        $returnedCodes = array_column(array_column($features, 'properties'), 'code');
        $this->assertNotContains($storeToDeactivate->code, $returnedCodes);
    }

    public function test_geojson_endpoint_supports_status_filtering(): void
    {
        // BDG is partial, SBY is offline, JKT is online
        $responseOnline = $this->actingAs($this->admin)->getJson('/monitoring/stores/geojson?status=online');
        $responseOnline->assertOk();
        $onlineFeatures = $responseOnline->json('features');

        foreach ($onlineFeatures as $f) {
            $this->assertSame('online', $f['properties']['markerStatus']);
        }

        $responsePartial = $this->actingAs($this->admin)->getJson('/monitoring/stores/geojson?status=partial');
        $responsePartial->assertOk();
        $partialFeatures = $responsePartial->json('features');

        foreach ($partialFeatures as $f) {
            $this->assertSame('partial', $f['properties']['markerStatus']);
        }
    }

    public function test_geojson_returns_city_region_and_address_properties(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/monitoring/stores/geojson');

        $response->assertOk();
        $feature = $response->json('features.0');

        $this->assertArrayHasKey('city', $feature['properties']);
        $this->assertArrayHasKey('region', $feature['properties']);
        $this->assertArrayHasKey('address', $feature['properties']);
        $this->assertNotEmpty($feature['properties']['city']);
    }

    public function test_geojson_search_by_city_and_region(): void
    {
        // Search by city 'Bandung'
        $response = $this->actingAs($this->admin)->getJson('/monitoring/stores/geojson?search=Bandung');
        $response->assertOk();
        $features = $response->json('features');
        $this->assertNotEmpty($features);

        foreach ($features as $f) {
            $this->assertStringContainsStringIgnoringCase('Bandung', $f['properties']['city'].' '.$f['properties']['name'].' '.$f['properties']['address']);
        }

        // Search by region 'Jawa Barat'
        $responseJabar = $this->actingAs($this->admin)->getJson('/monitoring/stores/geojson?search=Jawa%20Barat');
        $responseJabar->assertOk();
        $this->assertNotEmpty($responseJabar->json('features'));
    }

    public function test_geojson_search_respects_store_scope(): void
    {
        // SV is only assigned to Kemang (Jakarta)
        // Searching for Bandung should return 0 features for SV
        $response = $this->actingAs($this->sv)->getJson('/monitoring/stores/geojson?search=Bandung');

        $response->assertOk();
        $this->assertEmpty($response->json('features'));

        // Searching for Kemang should return 1 feature
        $responseKemang = $this->actingAs($this->sv)->getJson('/monitoring/stores/geojson?search=Kemang');
        $responseKemang->assertOk();
        $this->assertCount(1, $responseKemang->json('features'));
    }
}
