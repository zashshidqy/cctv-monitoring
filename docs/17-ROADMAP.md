# 17 — Development Roadmap

## Phase 0 — Discovery and technical proof

- Audit store list, coordinates, camera inventory, vendor/model/firmware.
- Confirm network topology and remote reachability.
- Test one representative camera/NVR per device family.
- Validate RTSP/ONVIF source and browser playback through gateway.
- Estimate concurrent viewers/streams and bandwidth.
- Verify official O!Save logo and color tokens.

**Exit criteria:** network/gateway direction and minimum supported connection matrix approved.

## Phase 1 — Foundation

- Laravel project/authentication.
- User, role, permission foundation.
- Store CRUD and store scope.
- Camera metadata CRUD.
- Design tokens and app shell.
- Admin access separation.

**Exit criteria:** secure login, role scope, stores and cameras manageable with tests.

## Phase 2 — Map experience

- MapLibre setup and production tile provider.
- Authorized store GeoJSON/data endpoint.
- Marker, cluster, status legend.
- Search/filter.
- Pitch 0–20° behavior, manual 2D/Tilt toggle.
- Store popup and responsive behavior.

**Exit criteria:** all accessible stores are discoverable; map is responsive and usable without 3D overload.

## Phase 3 — Camera experience

- Camera Explorer floating panel.
- Camera card/gallery and snapshot behavior.
- Playback session API.
- Gateway integration PoC.
- Single camera focus/player.
- Session release and concurrency control.

**Exit criteria:** one approved camera source can be viewed securely end to end.

## Phase 4 — Health and alerts

- Background health checks.
- Status aggregation.
- Active/recovered alerts.
- Notification Center.
- Alert scope permissions.

**Exit criteria:** offline detection is stable and false positives are measured.

## Phase 5 — User access and operations

- Staff permission UI.
- Store scope management.
- Audit log.
- Gateway monitoring.
- Deployment/backup/restore.

**Exit criteria:** operational administrators can manage users and system safely.

## Phase 6 — Extension

- More source adapters.
- Vendor integrations.
- Multi-camera simultaneous live view.
- External alert delivery.
- Recording/playback only if formally approved.

Do not start later phases while critical security or source compatibility issues remain.
