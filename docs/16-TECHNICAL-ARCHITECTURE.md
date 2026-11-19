# 16 — Technical Architecture

## 1. Recommended baseline (subject to repository inspection)

| Layer | Recommendation | Notes |
|---|---|---|
| Backend | Laravel 13 | Verify project constraints and supported PHP version |
| Frontend integration | Inertia + React | Laravel official React starter kit is a coherent fit |
| UI | TypeScript, Tailwind CSS 4, shadcn/ui | Use shadcn as source-owned components |
| Motion | CSS transitions; Aceternity selectively | Avoid unnecessary animation dependencies |
| Map | MapLibre GL JS | Vector map, pitch/camera controls |
| Database | MySQL/MariaDB | Confirm organization environment |
| Queue/cache | Redis optional/recommended | Health checks, alerts, async connection tests |
| Media gateway | MediaMTX candidate | Validate with real cameras/NVR and network |
| Realtime | Polling first; WebSocket/broadcast later | Choose based on alert freshness and scale |

If an existing project already uses a working stack, do not replace it without a documented reason.

## 2. Logical architecture

```text
User Browser
  ├── Laravel/Inertia React UI
  ├── MapLibre GL JS
  └── Authorized Camera Player
          |
          v
Laravel Application
  ├── Authentication & Authorization
  ├── Store/Camera/User APIs
  ├── Playback Session Service
  ├── Alert & Health Status API
  ├── Audit Service
  └── Queue Jobs
          |
          +---- MySQL/MariaDB
          +---- Redis/Queue (optional)
          +---- Map Tile Provider
          +---- Media Gateway API (internal only)
                       |
                       +---- Central Gateway (private network)
                       +---- Store Edge Gateway (if required)
                                  |
                                  +---- IP Camera / NVR / DVR
```

## 3. Backend boundaries

- Controllers should validate/request/authorize and delegate.
- Domain services handle store aggregates, permission calculation, playback session, alert state.
- Queue workers perform probes, snapshots, connection tests, and long-running gateway calls.
- Adapter layer abstracts camera source types.
- Repository pattern is optional; do not add abstraction without actual need.

## 4. Frontend boundaries

- `pages/monitoring`: map workspace and route-level state.
- `components/map`: map layers, markers, map controls.
- `components/camera`: explorer, mosaic, player.
- `components/alerts`: alert center and items.
- `components/admin`: forms/tables/permission management.
- `lib/authorization`: display helpers only; backend remains source of truth.
- `types`: API/domain types.

## 5. Status refresh

MVP may use modest polling for store/camera status and alert count. Tune interval after scale/performance testing. Use broadcast/WebSocket when latency requirements justify it. Avoid one request per marker; fetch aggregate status in batches.

## 6. API design principles

- Return only authorized resources.
- Use pagination for large lists.
- Filter/search server-side when data grows.
- Use stable identifiers.
- Use validation and consistent error envelope.
- Do not return `camera_sources` secrets.
- Use a distinct playback session endpoint with short-lived token semantics.

## 7. External services

Map tiles and media gateway are separate operational dependencies. Provide health indicators and graceful degraded states if either is unavailable.

## 8. Versioning and dependency management

- Pin dependencies via lock files.
- Verify current official docs during setup.
- Avoid copied snippets from third-party sources without review.
- Record package choice and version in ADR/dependency inventory.
