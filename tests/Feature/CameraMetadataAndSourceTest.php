<?php

namespace Tests\Feature;

use App\CameraStatus;
use App\Models\Camera;
use App\Models\CameraSource;
use App\Models\Store;
use App\Models\User;
use App\Services\StoreStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CameraMetadataAndSourceTest extends TestCase
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

    public function test_master_admin_can_view_cameras_management_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/cameras');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/cameras/index')
            ->has('cameras.data')
            ->has('stores')
        );
    }

    public function test_non_master_admin_cannot_access_cameras_management(): void
    {
        $response = $this->actingAs($this->gm)->get('/admin/cameras');
        $response->assertForbidden();

        $responseSv = $this->actingAs($this->sv)->get('/admin/cameras');
        $responseSv->assertForbidden();

        $responseStaff = $this->actingAs($this->staff)->get('/admin/cameras');
        $responseStaff->assertForbidden();
    }

    public function test_master_admin_can_register_camera_with_encrypted_source(): void
    {
        $secretPassword = 'SuperSecretCameraPassword123!';

        $payload = [
            'store_id' => $this->store->id,
            'code' => 'CAM-TEST-01',
            'name' => 'Kasir 01 Test Camera',
            'area_label' => 'Kasir Utama',
            'device_type' => 'ip_camera',
            'connection_type' => 'rtsp',
            'status' => 'online',
            'source_config' => [
                'host' => '192.168.1.100',
                'port' => '554',
                'path' => '/live/ch0',
                'username' => 'admin',
                'password' => $secretPassword,
            ],
        ];

        $response = $this->actingAs($this->admin)->post('/admin/cameras', $payload);

        $response->assertRedirect('/admin/cameras');

        $camera = Camera::where('code', 'CAM-TEST-01')->firstOrFail();
        $this->assertSame('Kasir 01 Test Camera', $camera->name);

        // Verify source record exists
        $source = CameraSource::where('camera_id', $camera->id)->firstOrFail();

        // 1. RAW Database column must NOT contain plain secret password (it must be encrypted)
        $rawRecord = DB::table('camera_sources')->where('id', $source->id)->first();
        $this->assertStringNotContainsString($secretPassword, $rawRecord->source_config_encrypted);

        // 2. Eloquent model decrypts properly for backend operations
        $this->assertSame($secretPassword, $source->source_config_encrypted['password']);

        // 3. Sanitized helper never outputs the secret password
        $sanitized = $source->getSanitizedConfig();
        $this->assertSame('********', $sanitized['password']);

        // 4. Audit log is written
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'camera.created',
            'subject_id' => $camera->id,
        ]);
    }

    public function test_test_connection_endpoint_validates_and_sanitizes_response(): void
    {
        $payload = [
            'connection_type' => 'rtsp',
            'config' => [
                'host' => 'demo-cam.local',
                'port' => 554,
                'path' => '/live/ch0',
                'username' => 'admin',
                'password' => 'secret123',
            ],
        ];

        $response = $this->actingAs($this->admin)->postJson('/admin/cameras/test-connection', $payload);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'latency_ms',
            'diagnostics',
        ]);

        // Password MUST NOT be echoed in JSON diagnostics
        $jsonString = $response->getContent();
        $this->assertStringNotContainsString('secret123', $jsonString);
    }

    public function test_master_admin_can_update_camera_metadata(): void
    {
        $camera = Camera::create([
            'store_id' => $this->store->id,
            'code' => 'CAM-UPDATE-01',
            'name' => 'Original Camera Name',
            'area_label' => 'Kasir',
            'device_type' => 'ip_camera',
            'connection_type' => 'rtsp',
            'status' => 'online',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->put("/admin/cameras/{$camera->id}", [
            'store_id' => $this->store->id,
            'code' => $camera->code,
            'name' => 'Updated Camera Name',
            'area_label' => 'Loading Dock',
            'device_type' => 'ip_camera',
            'connection_type' => 'rtsp',
            'status' => 'online',
        ]);

        $response->assertRedirect('/admin/cameras');
        $this->assertSame('Updated Camera Name', $camera->fresh()->name);
        $this->assertSame('Loading Dock', $camera->fresh()->area_label);
    }

    public function test_master_admin_can_soft_deactivate_camera(): void
    {
        $camera = Camera::create([
            'store_id' => $this->store->id,
            'code' => 'CAM-DEACT-01',
            'name' => 'Deactivate Camera Test',
            'area_label' => 'Kasir',
            'device_type' => 'ip_camera',
            'connection_type' => 'rtsp',
            'status' => 'online',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/admin/cameras/{$camera->id}");

        $response->assertRedirect('/admin/cameras');
        $fresh = $camera->fresh();
        $this->assertFalse($fresh->is_active);
        $this->assertSame('offline', $fresh->status);
        $this->assertNotNull($fresh->deactivated_at);
    }

    public function test_store_status_service_evaluates_real_database_cameras(): void
    {
        $service = app(StoreStatusService::class);

        // Create 2 online cameras and 1 offline camera for store
        Camera::create([
            'store_id' => $this->store->id,
            'code' => 'CAM-REAL-01',
            'name' => 'Cam 01',
            'area_label' => 'Area 1',
            'device_type' => 'ip_camera',
            'connection_type' => 'rtsp',
            'status' => CameraStatus::Online->value,
            'is_active' => true,
        ]);

        Camera::create([
            'store_id' => $this->store->id,
            'code' => 'CAM-REAL-02',
            'name' => 'Cam 02',
            'area_label' => 'Area 2',
            'device_type' => 'ip_camera',
            'connection_type' => 'rtsp',
            'status' => CameraStatus::Online->value,
            'is_active' => true,
        ]);

        Camera::create([
            'store_id' => $this->store->id,
            'code' => 'CAM-REAL-03',
            'name' => 'Cam 03',
            'area_label' => 'Area 3',
            'device_type' => 'ip_camera',
            'connection_type' => 'rtsp',
            'status' => CameraStatus::Offline->value,
            'is_active' => true,
        ]);

        $summary = $service->getStoreHealthSummary($this->store);

        $this->assertSame(3, $summary['cameraTotal']);
        $this->assertSame(2, $summary['cameraOnline']);
        $this->assertSame(1, $summary['cameraOffline']);
        $this->assertSame('partial', $summary['markerStatus']); // 2 online + 1 offline = partial
    }
}
