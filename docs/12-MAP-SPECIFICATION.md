# 12 — Map Specification

## 1. Map behavior

- Use MapLibre GL JS as current candidate.
- Use a light, low-noise vector style.
- Store marker, not individual camera marker.
- Cluster markers at broad zoom levels.
- Map starts in 2D (pitch 0°).
- When zooming in, ease pitch upward toward a maximum target of 15–20°.
- Provide manual 2D / Tilt View control.
- Do not use full terrain/globe/strong 3D.

## 2. Pitch behavior (draft)

| Map scale | Pitch target |
|---|---:|
| Broad region | 0° |
| City view | 0–6° |
| District view | 6–12° |
| Store vicinity | 12–15° |
| Close view | 15–20° maximum |

Actual zoom thresholds must be tuned with real store coordinates and chosen map style. Pitch is a visual perspective, not proof that the map contains accurate 3D building geometry.

## 3. Rendering/performance

- Prefer vector tiles from a provider with production SLA/terms or self-hosted tiles.
- Do not assume the public OSM raster tile service is an unlimited production tile CDN. Follow its usage policy or select an appropriate provider.
- Show required attribution visibly.
- Make tile style URL configurable.
- Use source/layer clustering rather than thousands of independent DOM markers where appropriate.
- Use WebGL-native layers where possible.
- Avoid terrain and heavy building extrusion in MVP.
- Debounce search and avoid refitting map on every keystroke.
- Do not reload map instance when selected store changes.

## 4. Store marker state

Overall store status calculation should be deterministic:

- `unknown`: no reliable health data or no check completed.
- `offline`: all monitored cameras are Offline (and none is in a transient/unknown state that should prevent this classification).
- `partial`: some cameras are healthy while at least one is Unstable/Offline/Unknown.
- `online`: all monitored cameras are Online.
- Store with zero cameras: `unknown` or `not_configured`, not Online.

Product owner must approve exact precedence for Unknown/Unstable in aggregate logic.

## 5. Map interaction

- Hover/focus marker tooltip.
- Click marker selects store and opens popup.
- Clicking same selected marker may toggle popup or keep open; choose consistent behavior.
- Click elsewhere on map closes popup only if user has no unsaved state in panel.
- Search result selects/fly-to/open popup.
- Cluster click zooms into cluster.
- Reset control returns to configured default region/zoom/pitch.
- Keep map controls separate from camera panel and attribution.

## 6. Map data security

Backend returns only stores the current user may see. Do not send all store coordinates to client and rely on marker hiding for SV. Search API, cluster API, and detail endpoint must enforce scope.

## 7. Data attribution

Display attribution for chosen map tiles/data source. If OpenStreetMap data is used, comply with OSM attribution and tile-provider policy. Do not bulk-prefetch tiles from public OSM tile servers.
