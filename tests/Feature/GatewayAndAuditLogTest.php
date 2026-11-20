<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Gateway;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GatewayAndAuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $gm;

    protected User $sv;

    protected User $staff;

    protected Store $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->admin = User::where('email', 'admin@osave.id')->firstOrFail();
        $this->gm = User::where('email', 'gm@osave.id')->firstOrFail();
        $this->sv = User::where('email', 'sv.kemang@osave.id')->firstOrFail();
        $this->staff = User::where('email', 'staff@osave.id')->firstOrFail();
        $this->store = Store::firstOrFail();
    }

    // ─── Audit Log Tests (Revisi 4) ─────────────────────────────────────────────

    public function test_master_admin_can_access_activity_logs_via_admin_route(): void
    {
        ActivityLog::create([
            'actor_user_id' => $this->admin->id,
            'action' => 'system.test_event',
            'metadata' => ['key' => 'value'],
            'occurred_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/activity-logs');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/logs/index')
            ->has('logs.data')
            ->has('filters')
        );
    }

    public function test_activity_logs_shortcut_redirects_to_admin_activity_logs(): void
    {
        $response = $this->actingAs($this->admin)->get('/activity-logs');

        $response->assertRedirect('/admin/activity-logs');
    }

    public function test_non_admin_cannot_access_admin_activity_logs(): void
    {
        $responseGm = $this->actingAs($this->gm)->get('/admin/activity-logs');
        $responseGm->assertForbidden();

        $responseSv = $this->actingAs($this->sv)->get('/admin/activity-logs');
        $responseSv->assertForbidden();

        $responseStaff = $this->actingAs($this->staff)->get('/admin/activity-logs');
        $responseStaff->assertForbidden();
    }

    public function test_activity_logs_filter_by_action(): void
    {
        ActivityLog::create([
            'actor_user_id' => $this->admin->id,
            'action' => 'user.login_attempt',
            'occurred_at' => now(),
        ]);

        ActivityLog::create([
            'actor_user_id' => $this->admin->id,
            'action' => 'camera.config_change',
            'occurred_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/activity-logs?action=login');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/logs/index')
            ->where('filters.action', 'login')
        );
    }

    // ─── Gateway Tests (Revisi 3) ───────────────────────────────────────────────

    public function test_master_admin_can_access_gateways_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/gateways');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/gateways/index')
            ->has('gateways.data')
            ->has('stores')
            ->has('filters')
            ->has('stats')
        );
    }

    public function test_non_master_admin_cannot_access_gateways(): void
    {
        $responseGm = $this->actingAs($this->gm)->get('/admin/gateways');
        $responseGm->assertForbidden();

        $responseSv = $this->actingAs($this->sv)->get('/admin/gateways');
        $responseSv->assertForbidden();

        $responseStaff = $this->actingAs($this->staff)->get('/admin/gateways');
        $responseStaff->assertForbidden();
    }

    public function test_master_admin_can_create_central_gateway(): void
    {
        $payload = [
            'code' => 'GW-TEST-CENTRAL',
            'name' => 'Test Central Media Gateway',
            'type' => 'central',
            'host' => 'gw-central-test.osave.id',
            'port' => 8554,
            'status' => 'online',
            'version' => 'v1.4.2',
            'notes' => 'Automated test gateway node',
        ];

        $response = $this->actingAs($this->admin)->post('/admin/gateways', $payload);

        $response->assertRedirect('/admin/gateways');
        $this->assertDatabaseHas('gateways', [
            'code' => 'GW-TEST-CENTRAL',
            'type' => 'central',
            'store_id' => null,
            'status' => 'online',
        ]);

        // Audit log created
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'gateway.created',
        ]);
    }

    public function test_master_admin_can_create_edge_gateway_with_store(): void
    {
        $payload = [
            'code' => 'GW-TEST-EDGE',
            'name' => 'Test Edge Gateway Kemang',
            'type' => 'edge',
            'store_id' => $this->store->id,
            'host' => '192.168.10.1',
            'port' => 8554,
            'status' => 'online',
            'version' => 'v1.4.2',
        ];

        $response = $this->actingAs($this->admin)->post('/admin/gateways', $payload);

        $response->assertRedirect('/admin/gateways');
        $this->assertDatabaseHas('gateways', [
            'code' => 'GW-TEST-EDGE',
            'type' => 'edge',
            'store_id' => $this->store->id,
        ]);
    }

    public function test_edge_gateway_requires_store_id(): void
    {
        $payload = [
            'code' => 'GW-INVALID-EDGE',
            'name' => 'Edge Gateway Without Store',
            'type' => 'edge',
            'store_id' => null,
            'status' => 'online',
        ];

        $response = $this->actingAs($this->admin)->post('/admin/gateways', $payload);

        $response->assertSessionHasErrors(['store_id']);
    }

    public function test_gateway_code_must_be_unique(): void
    {
        Gateway::create([
            'code' => 'GW-DUP-01',
            'name' => 'First Gateway',
            'type' => 'central',
            'status' => 'online',
        ]);

        $payload = [
            'code' => 'GW-DUP-01',
            'name' => 'Duplicate Code Gateway',
            'type' => 'central',
            'status' => 'online',
        ];

        $response = $this->actingAs($this->admin)->post('/admin/gateways', $payload);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_master_admin_can_update_gateway(): void
    {
        $gateway = Gateway::create([
            'code' => 'GW-UPDATE-01',
            'name' => 'Original Name',
            'type' => 'central',
            'status' => 'online',
        ]);

        $response = $this->actingAs($this->admin)->put("/admin/gateways/{$gateway->id}", [
            'code' => 'GW-UPDATE-01',
            'name' => 'Updated Name',
            'type' => 'central',
            'status' => 'degraded',
            'version' => 'v1.5.0',
        ]);

        $response->assertRedirect('/admin/gateways');
        $this->assertDatabaseHas('gateways', [
            'id' => $gateway->id,
            'name' => 'Updated Name',
            'status' => 'degraded',
            'version' => 'v1.5.0',
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'gateway.updated',
        ]);
    }

    public function test_master_admin_can_delete_gateway(): void
    {
        $gateway = Gateway::create([
            'code' => 'GW-DELETE-01',
            'name' => 'Gateway To Delete',
            'type' => 'central',
            'status' => 'offline',
        ]);

        $response = $this->actingAs($this->admin)->delete("/admin/gateways/{$gateway->id}");

        $response->assertRedirect('/admin/gateways');
        $this->assertDatabaseMissing('gateways', [
            'id' => $gateway->id,
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'gateway.deleted',
        ]);
    }

    public function test_ping_gateway_updates_heartbeat(): void
    {
        $gateway = Gateway::create([
            'code' => 'GW-PING-01',
            'name' => 'Gateway To Ping',
            'type' => 'central',
            'status' => 'offline',
            'last_heartbeat_at' => null,
        ]);

        $response = $this->actingAs($this->admin)->postJson("/admin/gateways/{$gateway->id}/ping");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
        ]);

        $gateway->refresh();
        $this->assertEquals('online', $gateway->status);
        $this->assertNotNull($gateway->last_heartbeat_at);
    }
}
