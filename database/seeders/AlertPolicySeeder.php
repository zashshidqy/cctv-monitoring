<?php

namespace Database\Seeders;

use App\Models\AlertPolicy;
use Illuminate\Database\Seeder;

class AlertPolicySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Master Admin: All alerts (critical only for actionable, but can see all)
        AlertPolicy::updateOrCreate(
            ['role' => 'master_admin'],
            [
                'alert_level' => 'critical', // Only actionable critical alerts by default
                'allowed_types' => ['offline', 'camera_reboot', 'network_issue', 'unstable_connection'],
                'require_approval' => false, // Master admin can act directly
                'deduplication_minutes' => 5,
                'enabled' => true,
                'metadata' => [
                    'description' => 'Master Admin receives critical alerts for all stores. Can see all alert types.',
                    'auto_assign' => true,
                    'notify_channels' => ['bell', 'email'],
                ],
            ]
        );

        // GM (General Manager): All alerts for all stores
        AlertPolicy::updateOrCreate(
            ['role' => 'gm'],
            [
                'alert_level' => null, // All levels
                'allowed_types' => ['offline', 'camera_reboot', 'network_issue', 'unstable_connection'],
                'require_approval' => true, // GM must approve SV actions
                'deduplication_minutes' => 5,
                'enabled' => true,
                'metadata' => [
                    'description' => 'GM receives all alerts for all stores. Must approve SV escalations.',
                    'auto_assign' => true,
                    'notify_channels' => ['bell', 'email', 'slack'],
                ],
            ]
        );

        // SV (Supervisor): Only alerts for assigned stores
        AlertPolicy::updateOrCreate(
            ['role' => 'sv'],
            [
                'alert_level' => 'warning', // Warning and above (critical included since warning is lower)
                'allowed_types' => ['unstable_connection', 'offline', 'camera_reboot'],
                'require_approval' => true, // SV requests approval from GM
                'deduplication_minutes' => 5,
                'enabled' => true,
                'metadata' => [
                    'description' => 'SV receives alerts for assigned stores only. Warning and critical. Must request GM approval.',
                    'auto_assign' => true,
                    'notify_channels' => ['bell'],
                    'scope' => 'assigned_stores',
                ],
            ]
        );

        // Staff: No alerts by default (only sees what's in monitoring map)
        AlertPolicy::updateOrCreate(
            ['role' => 'staff'],
            [
                'alert_level' => null,
                'allowed_types' => [],
                'require_approval' => true,
                'deduplication_minutes' => 5,
                'enabled' => false, // Disabled by default
                'metadata' => [
                    'description' => 'Staff does not receive proactive alerts by default. Can view camera status on map.',
                    'auto_assign' => false,
                    'notify_channels' => [],
                    'scope' => 'none',
                ],
            ]
        );

        $this->command->info('AlertPolicy seeder completed with 4 role-based policies.');
    }
}
