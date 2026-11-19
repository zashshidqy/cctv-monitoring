# 13 — Data Model (Conceptual)

This is a logical model, not a final migration script. Review after device/network discovery.

## 1. Core entities

### users

- `id`
- `name`
- `email` (unique)
- `password` (framework hash)
- `status` (active, inactive, locked)
- `last_login_at`
- timestamps

### roles

- `id`, `name`, `slug`, `description`, `is_system_role`
- System roles: master_admin, gm, sv, staff

### permissions

- `id`, `name`, `slug`, `module`, `description`

### role_permissions

- `role_id`, `permission_id`

### user_permissions (optional overrides)

- `user_id`, `permission_id`, `effect` (grant/deny), `reason`, `created_by`
- Define precedence explicitly. Do not create contradictory overrides casually.

### stores

- `id`, `code` unique, `name`, `address`, `city`, `region`, `postal_code` optional
- `latitude`, `longitude`
- `status` (active/inactive)
- `notes` optional
- timestamps, `deactivated_at` optional

### store_user_assignments

- `user_id`, `store_id`, `assigned_by`, `status`, `starts_at`, `ends_at` optional
- Supports SV and Staff store scopes.

### gateways

- `id`, `code`, `name`, `type` (central/edge), `store_id` nullable for central
- `status`, `version`, `last_heartbeat_at`, `metadata` JSON without secrets

### cameras

- `id`, `store_id`, `gateway_id` nullable
- `code`, `name`, `area_label`, `channel_number` nullable
- `device_type` (ip_camera, nvr_channel, dvr_channel, other)
- `connection_type` (onvif, rtsp, hls, webrtc, mjpeg, snapshot, vendor, custom)
- `status` derived or cached from health checks
- `is_active`, `last_checked_at`, `last_success_at`
- timestamps, `deactivated_at`

### camera_sources

- `id`, `camera_id`, `source_kind`, `source_config_encrypted`
- `credential_reference` or encrypted credential fields
- `is_primary`, `is_active`, `created_by`, timestamps
- Avoid storing credential inside ordinary JSON/log fields. Use application encryption or external secret manager.

### camera_health_checks

- `id`, `camera_id`, `gateway_id`, `checked_at`, `result`, `failure_category`, `latency_ms` nullable, `details_redacted` JSON

### alerts

- `id`, `store_id`, `camera_id`, `alert_type`, `status`, `first_detected_at`, `last_detected_at`, `recovered_at` nullable, `acknowledged_by` nullable, `acknowledged_at` nullable

### alert_events

- `id`, `alert_id`, `event_type`, `occurred_at`, `actor_user_id` nullable, `metadata_redacted`

### playback_sessions

- `id`, `camera_id`, `user_id`, `gateway_id`, `output_protocol`, `session_reference`, `started_at`, `expires_at`, `ended_at`, `status`
- Never store reusable public playback secret in plain text.

### activity_logs

- `id`, `actor_user_id`, `action`, `subject_type`, `subject_id`, `occurred_at`, `ip_hash_or_policy_field`, `metadata_redacted`

## 2. Relationship outline

```text
users --< store_user_assignments >-- stores
users --< user_permissions >-- permissions
roles --< role_permissions >-- permissions
users >-- roles (single role MVP; consider pivot if multi-role becomes real need)
stores --< cameras
stores --< gateways (edge gateway may belong to one store)
gateways --< cameras
cameras --< camera_sources
cameras --< camera_health_checks
cameras --< alerts --< alert_events
users --< playback_sessions >-- cameras
users --< activity_logs
```

## 3. Derived state vs stored data

- Camera health is derived from health-check history and current policy; a cached `status` can improve map performance but must be refreshable.
- Store status is an aggregate over active monitored cameras.
- Permission result is computed from role + overrides + store scope.
- Never trust frontend-submitted status, store scope, or permission.

## 4. Deletion policy

Prefer soft deactivation/archive over destructive deletion for stores, cameras, users, gateways, and alerts with historical references. The exact retention policy must be approved by the organization.

## 5. Indexes and constraints

- Unique store code.
- Unique camera code (global or scoped; choose and document one).
- Index `cameras.store_id`, status, `alerts.store_id/status`, `camera_health_checks.camera_id/checked_at`, `store_user_assignments.user_id/store_id`.
- Foreign keys and constrained enums/checks where supported.
- Latitude between -90 and 90; longitude between -180 and 180.
