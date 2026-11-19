# 21 — Implementation Backlog

Use this backlog as a sequence, not as permission to skip discovery. Mark each task `Todo`, `In Progress`, `Blocked`, or `Done` in the project tracker.

## Epic 0 — Discovery / PoC

- [ ] Collect list of stores and verified coordinates.
- [ ] Collect camera/NVR/DVR inventory by model/firmware.
- [ ] Confirm network topology and remote access path.
- [ ] Test one camera source from each device family.
- [ ] Test candidate gateway and browser playback.
- [ ] Select map tile provider and verify terms/attribution.
- [ ] Validate official logo and brand color values.

## Epic 1 — Project foundation

- [ ] Inspect repository and determine whether stack exists.
- [ ] Configure Laravel auth.
- [ ] Configure React/TypeScript/Inertia if baseline accepted.
- [ ] Configure Tailwind and shadcn/ui.
- [ ] Add design tokens and shared layout.
- [ ] Add lint, format, type check, and tests.

## Epic 2 — Identity and authorization

- [ ] Create roles and permission catalog.
- [ ] Add store assignment model.
- [ ] Implement backend permission service/policies.
- [ ] Add role/permission tests.
- [ ] Build user management basics.
- [ ] Ensure Staff default access is empty.

## Epic 3 — Store management and map

- [ ] Store schema and migrations.
- [ ] Store CRUD and validation.
- [ ] MapLibre workspace.
- [ ] Authorized store GeoJSON endpoint.
- [ ] Marker and cluster.
- [ ] Store status aggregation.
- [ ] Search/filter.
- [ ] 2D / 15–20° tilt behavior.
- [ ] Store popup.

## Epic 4 — Camera metadata and source management

- [ ] Camera schema and migrations.
- [ ] Camera CRUD.
- [ ] Connection adapter interface.
- [ ] ONVIF/RTSP/NVR PoC.
- [ ] Camera onboarding wizard.
- [ ] Encrypted source credential storage.
- [ ] Test connection job.

## Epic 5 — Player experience

- [ ] Camera Explorer panel.
- [ ] Dynamic Mosaic layout.
- [ ] Snapshot adapter and freshness label.
- [ ] Playback session endpoint.
- [ ] Media gateway integration.
- [ ] WebRTC/HLS playback tests.
- [ ] Camera Focus view.
- [ ] Session expiry/release and concurrency control.

## Epic 6 — Health and alerts

- [ ] Camera probe scheduler/worker.
- [ ] Health-check history.
- [ ] State transition policy.
- [ ] Alert deduplication/grouping.
- [ ] Recovery event.
- [ ] Alert Center UI.
- [ ] GM/SV action policy approval.

## Epic 7 — Admin completion

- [ ] Store management screens.
- [ ] Camera management screens.
- [ ] User management screens.
- [ ] Staff permission templates.
- [ ] Per-user permission overrides.
- [ ] Store scope selector.
- [ ] Gateway management.
- [ ] Activity log.

## Epic 8 — Hardening and pilot

- [ ] Security review.
- [ ] Load/performance test.
- [ ] Backup/restore test.
- [ ] Staging pilot at one store.
- [ ] Fix operational issues.
- [ ] Expand to additional stores gradually.
