# 20 — Testing & Acceptance Criteria

## 1. Acceptance criteria — map

- [ ] User only receives authorized store coordinates.
- [ ] Each marker represents one store.
- [ ] Marker status uses correct aggregate state.
- [ ] Clustering works at broad zoom levels.
- [ ] Search/filter updates authorized results.
- [ ] Popup opens and remains within viewport.
- [ ] Map defaults to 2D.
- [ ] Zoom-dependent pitch stays within configured 0–20° maximum.
- [ ] User can restore 2D view.
- [ ] Map attribution is visible.
- [ ] Tile failure has a graceful fallback/error state.

## 2. Acceptance criteria — Camera Explorer/player

- [ ] Explorer opens from selected store without losing map context.
- [ ] Only cameras belonging to the selected authorized store are returned.
- [ ] Metadata loads before stream.
- [ ] No stream starts automatically for every camera.
- [ ] Snapshot is labeled with timestamp and not called live.
- [ ] Single selected camera can start an authorized playback session.
- [ ] RTSP source and credential never appear in client payload.
- [ ] Player handles connecting, playing, reconnecting, offline, unsupported, and error.
- [ ] Closing player releases/lets session expire.
- [ ] Unauthorized user cannot get a playback token by changing camera ID.

## 3. Acceptance criteria — role/permission

- [ ] Master Admin can manage all system resources.
- [ ] GM can view all stores/cameras but cannot perform admin mutation by default.
- [ ] SV sees only assigned store(s).
- [ ] Staff with no permission cannot access operational modules.
- [ ] Staff permission and store scope changes are audit logged.
- [ ] Backend denies direct API/URL attempts outside scope.
- [ ] Disabled user cannot create/renew playback session.

## 4. Acceptance criteria — health and alerts

- [ ] Health check runs through gateway/worker.
- [ ] One transient failure does not immediately create Offline alert.
- [ ] Repeated failure threshold changes status according to configuration.
- [ ] Gateway outage is distinguished from individual camera outage where possible.
- [ ] Duplicate alert spam is suppressed.
- [ ] Recovery event is created when camera returns.
- [ ] Alert list applies user scope.
- [ ] Alert action controls are hidden and backend-denied until permission policy is approved.

## 5. Security test checklist

- [ ] No camera source secret in frontend source, network response, browser storage, or logs.
- [ ] No unauthenticated stream or snapshot access.
- [ ] No IDOR across store/camera/alert/user IDs.
- [ ] SSRF protections tested for URL-based connection options.
- [ ] Session expiration and permission revocation behave as designed.
- [ ] CSRF, XSS, SQL injection, rate limits, and input validation reviewed.
- [ ] Admin mutations audited.
- [ ] TLS enforced in staging/production.

## 6. UI quality tests

- [ ] Visual hierarchy matches design system.
- [ ] No glassmorphism/pixel art/generic gradient card pattern.
- [ ] Neumorphic shadows do not reduce text/control contrast.
- [ ] All controls have keyboard focus state.
- [ ] Reduced motion works.
- [ ] Desktop/tablet/mobile layouts verified.
- [ ] Loading, empty, error, permission, offline states are designed.
- [ ] No placeholder/demo data is presented as real operational data.

## 7. Performance tests

Measure on representative operational laptop/network:

- Initial application load.
- Map first render and store marker interaction.
- Camera Explorer open time.
- Stream startup time and stability.
- Browser memory/CPU for one and multiple streams.
- Gateway CPU/memory/network use.
- Behavior under loss of gateway, camera, database, and tile provider.

Set numeric performance budgets only after representative data and hardware are known.
