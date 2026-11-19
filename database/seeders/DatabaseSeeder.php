<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Store;
use App\Models\StoreUserAssignment;
use App\Models\User;
use App\RoleSlug;
use App\UserStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ─── 1. Roles ─────────────────────────────────────────────────────────
        $roles = [
            RoleSlug::MasterAdmin->value => [
                'name' => 'Master Admin',
                'description' => 'Akses penuh ke semua store, kamera, user, konfigurasi, dan audit log.',
            ],
            RoleSlug::Gm->value => [
                'name' => 'General Manager',
                'description' => 'Akses monitoring global ke seluruh store aktif O!Save.',
            ],
            RoleSlug::Sv->value => [
                'name' => 'Supervisor',
                'description' => 'Akses monitoring khusus untuk store yang ditugaskan.',
            ],
            RoleSlug::Staff->value => [
                'name' => 'Staff',
                'description' => 'Role dasar dengan akses operasional nol secara default. Izin diberikan oleh Master Admin.',
            ],
        ];

        $roleModels = [];
        foreach ($roles as $slug => $data) {
            $roleModels[$slug] = Role::create([
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'],
                'is_system_role' => true,
            ]);
        }

        // ─── 2. Permissions Catalog (draft from 09-ROLE-ACCESS-CONTROL.md) ────
        $permissions = [
            // Monitoring
            ['name' => 'Lihat Monitoring', 'slug' => 'monitoring.view', 'module' => 'monitoring', 'description' => 'Membuka workspace monitoring map'],
            ['name' => 'Lihat Store', 'slug' => 'stores.view', 'module' => 'monitoring', 'description' => 'Melihat daftar dan metadata store'],
            ['name' => 'Lihat Kamera', 'slug' => 'cameras.view', 'module' => 'monitoring', 'description' => 'Melihat metadata dan status kamera'],
            ['name' => 'Live View Kamera', 'slug' => 'cameras.live_view', 'module' => 'monitoring', 'description' => 'Membuka live stream kamera terpilih'],
            ['name' => 'Lihat Alert', 'slug' => 'alerts.view', 'module' => 'monitoring', 'description' => 'Melihat notifikasi dan alert insiden kamera'],

            // Admin Operations
            ['name' => 'Tambah Store', 'slug' => 'stores.create', 'module' => 'stores', 'description' => 'Mendaftarkan store baru'],
            ['name' => 'Ubah Store', 'slug' => 'stores.update', 'module' => 'stores', 'description' => 'Mengubah data store'],
            ['name' => 'Nonaktifkan Store', 'slug' => 'stores.deactivate', 'module' => 'stores', 'description' => 'Menonaktifkan store (soft deactivation)'],

            ['name' => 'Tambah Kamera', 'slug' => 'cameras.create', 'module' => 'cameras', 'description' => 'Mendaftarkan kamera baru ke store'],
            ['name' => 'Ubah Kamera', 'slug' => 'cameras.update', 'module' => 'cameras', 'description' => 'Mengubah konfigurasi kamera'],
            ['name' => 'Nonaktifkan Kamera', 'slug' => 'cameras.deactivate', 'module' => 'cameras', 'description' => 'Menonaktifkan kamera'],
            ['name' => 'Kelola Source Kamera', 'slug' => 'camera_sources.manage', 'module' => 'cameras', 'description' => 'Mengatur credential dan source connection kamera'],

            ['name' => 'Lihat Gateway', 'slug' => 'gateways.view', 'module' => 'gateways', 'description' => 'Melihat status media gateway'],
            ['name' => 'Kelola Gateway', 'slug' => 'gateways.manage', 'module' => 'gateways', 'description' => 'Mengonfigurasi media gateway node'],

            ['name' => 'Lihat User', 'slug' => 'users.view', 'module' => 'users', 'description' => 'Melihat daftar user dan role'],
            ['name' => 'Tambah User', 'slug' => 'users.create', 'module' => 'users', 'description' => 'Membuat akun user baru'],
            ['name' => 'Ubah User', 'slug' => 'users.update', 'module' => 'users', 'description' => 'Mengubah user, role, dan store assignment'],
            ['name' => 'Nonaktifkan User', 'slug' => 'users.deactivate', 'module' => 'users', 'description' => 'Mengunci atau menonaktifkan akun user'],

            ['name' => 'Kelola Permission', 'slug' => 'permissions.manage', 'module' => 'system', 'description' => 'Mengatur template permission Staff dan override user'],
            ['name' => 'Lihat Audit Log', 'slug' => 'audit_logs.view', 'module' => 'system', 'description' => 'Melihat catatan audit perubahan sistem'],
            ['name' => 'Pengaturan Sistem', 'slug' => 'system_settings.manage', 'module' => 'system', 'description' => 'Mengatur threshold dan konfigurasi global'],
        ];

        $permissionModels = [];
        foreach ($permissions as $perm) {
            $permissionModels[$perm['slug']] = Permission::create($perm);
        }

        // ─── 3. Role-Permission Assignments ───────────────────────────────────

        // GM: Global viewing scope (all monitoring read permissions, no admin mutations)
        $gmPerms = ['monitoring.view', 'stores.view', 'cameras.view', 'cameras.live_view', 'alerts.view'];
        $roleModels[RoleSlug::Gm->value]->permissions()->sync(
            array_map(fn ($slug) => $permissionModels[$slug]->id, $gmPerms)
        );

        // SV: Store-scoped monitoring (same view permissions, scoped by backend to assigned store)
        $svPerms = ['monitoring.view', 'stores.view', 'cameras.view', 'cameras.live_view', 'alerts.view'];
        $roleModels[RoleSlug::Sv->value]->permissions()->sync(
            array_map(fn ($slug) => $permissionModels[$slug]->id, $svPerms)
        );

        // Staff: Default empty (zero operational permissions) — explicit design requirement
        $roleModels[RoleSlug::Staff->value]->permissions()->sync([]);

        // Master Admin: All permissions
        $roleModels[RoleSlug::MasterAdmin->value]->permissions()->sync(
            array_column($permissionModels, 'id')
        );

        // ─── 4. Demo Stores (DEMO data labeled clearly per rules) ─────────────
        $demoStores = [
            [
                'code' => 'DEMO-JKT-01',
                'name' => 'O!Save Kemang Raya (DEMO)',
                'address' => 'Jl. Kemang Raya No. 42, Bangka, Mampang Prapatan',
                'city' => 'Jakarta Selatan',
                'region' => 'DKI Jakarta',
                'postal_code' => '12730',
                'latitude' => -6.2731000,
                'longitude' => 106.8163000,
                'status' => 'active',
                'notes' => 'DATA DEMO — untuk pengujian Epic 1 Foundation',
            ],
            [
                'code' => 'DEMO-JKT-02',
                'name' => 'O!Save Tebet Timur (DEMO)',
                'address' => 'Jl. Tebet Timur Dalam Raya No. 18, Tebet',
                'city' => 'Jakarta Selatan',
                'region' => 'DKI Jakarta',
                'postal_code' => '12820',
                'latitude' => -6.2367000,
                'longitude' => 106.8524000,
                'status' => 'active',
                'notes' => 'DATA DEMO — untuk pengujian Epic 1 Foundation',
            ],
            [
                'code' => 'DEMO-BDG-01',
                'name' => 'O!Save Dago Pakar (DEMO)',
                'address' => 'Jl. Ir. H. Juanda No. 120, Dago, Coblong',
                'city' => 'Bandung',
                'region' => 'Jawa Barat',
                'postal_code' => '40135',
                'latitude' => -6.8856000,
                'longitude' => 107.6138000,
                'status' => 'active',
                'notes' => 'DATA DEMO — untuk pengujian Epic 1 Foundation',
            ],
            [
                'code' => 'DEMO-SBY-01',
                'name' => 'O!Save Manyar Kertoarjo (DEMO)',
                'address' => 'Jl. Manyar Kertoarjo No. 55, Mojo, Gubeng',
                'city' => 'Surabaya',
                'region' => 'Jawa Timur',
                'postal_code' => '60285',
                'latitude' => -7.2798000,
                'longitude' => 112.7634000,
                'status' => 'active',
                'notes' => 'DATA DEMO — untuk pengujian Epic 1 Foundation',
            ],
        ];

        $storeModels = [];
        foreach ($demoStores as $store) {
            $storeModels[] = Store::create($store);
        }

        // ─── 5. Demo Users (one for each role, clearly labeled DEMO) ───────────
        $users = [
            [
                'name' => 'Master Administrator',
                'email' => 'admin@osave.id',
                'password' => Hash::make('Admin123!'),
                'role_id' => $roleModels[RoleSlug::MasterAdmin->value]->id,
                'status' => UserStatus::Active->value,
            ],
            [
                'name' => 'General Manager Demo',
                'email' => 'gm@osave.id',
                'password' => Hash::make('Gm123!'),
                'role_id' => $roleModels[RoleSlug::Gm->value]->id,
                'status' => UserStatus::Active->value,
            ],
            [
                'name' => 'Store Supervisor Demo (Kemang)',
                'email' => 'sv.kemang@osave.id',
                'password' => Hash::make('Sv123!'),
                'role_id' => $roleModels[RoleSlug::Sv->value]->id,
                'status' => UserStatus::Active->value,
            ],
            [
                'name' => 'Staff Demo (No Perms)',
                'email' => 'staff@osave.id',
                'password' => Hash::make('Staff123!'),
                'role_id' => $roleModels[RoleSlug::Staff->value]->id,
                'status' => UserStatus::Active->value,
            ],
        ];

        $userModels = [];
        foreach ($users as $u) {
            $userModels[] = User::create($u);
        }

        // ─── 6. Store Assignments ─────────────────────────────────────────────
        // SV assigned only to Store 1 (Kemang Raya)
        StoreUserAssignment::create([
            'user_id' => $userModels[2]->id, // SV
            'store_id' => $storeModels[0]->id, // Kemang
            'status' => 'active',
            'assigned_by' => $userModels[0]->id,
            'starts_at' => now(),
        ]);
    }
}
