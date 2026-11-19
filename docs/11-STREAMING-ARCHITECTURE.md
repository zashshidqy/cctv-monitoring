# 11 — Streaming Architecture

## 1. Core rule

Browser tidak boleh mengakses RTSP source secara langsung. Semua sumber dan credential kamera ditangani backend/gateway.

## 2. Logical pipeline

```text
IP Camera / NVR / DVR / Existing Stream
              |
              | source protocol (often RTSP / ONVIF-assisted URI)
              v
     Store Edge Gateway or Central Media Gateway
              |
              | normalize / proxy / auth / optional transcode
              v
        Browser Playback Output
        - WebRTC (low-latency target)
        - HLS (compatibility/scalability trade-off)
        - MJPEG (specific cases)
              |
              v
       O!Save Monitor Camera Player
```

## 3. Candidate media gateway

MediaMTX is a candidate because its documentation describes multiple publish/read protocols and protocol conversion. It is not an automatic final choice: run a proof of concept against actual camera/NVR models, codecs, network path, authentication requirements, and expected concurrent sessions.

## 4. Central vs edge gateway

### Option A — Central gateway

Suitable only when camera/NVR sources are reachable through a controlled private network/VPN from the central infrastructure.

Pros: fewer components to manage.  
Risks: inter-site routing, bandwidth concentration, network segmentation, and failure blast radius.

### Option B — Store edge gateway

Small managed gateway/agent inside each store network; it connects outbound securely to central infrastructure and handles local camera reachability.

Pros: cameras remain private to store LAN; source connection is local; easier to support isolated store networks.  
Risks: requires per-store device lifecycle, update, monitoring, and operational support.

### Option C — Hybrid

Use central gateway where private network permits and edge gateway for isolated stores.

**Recommendation:** decide after network survey. Do not expose camera/NVR ports directly to the public internet. Prefer private routing or an authenticated outbound edge connection.

## 5. Playback selection

Use server-side policy to select playback output:

- WebRTC: preferred where low latency is important and browser/network support is proven.
- HLS: fallback/alternative where latency tolerance and infrastructure make it appropriate.
- MJPEG: only for compatible sources and limited cases.
- Snapshot: never represented as live video.

The frontend receives a short-lived authorized playback session, not source credentials.

## 6. Session lifecycle

1. User requests camera playback.
2. Backend checks user active, permission, store scope, camera active, source/gateway status.
3. Backend creates playback session with expiration and concurrency policy.
4. Gateway authorizes viewer through scoped token/credential.
5. Player starts.
6. Heartbeat/lease keeps session valid where appropriate.
7. On close, release session. Expired sessions are cleaned up server-side.
8. Permission changes revoke or prevent renewal of sessions according to policy.

## 7. Capacity control

- Do not auto-start every camera in a store.
- Lazy load streams only after selection.
- Apply per-user/per-store/global concurrent stream limits after capacity test.
- Prefer one stream per selected camera session; reuse/restream only if security and source load implications are understood.
- Use lower-resolution substream for thumbnails if devices support it; do not transcode everything by default.
- Measure bandwidth, decode CPU, memory, and gateway sessions.

## 8. Codec and browser compatibility

Video may fail despite protocol connectivity due to unsupported codecs/container/profile. The onboarding test should inspect codec information when available. Transcoding can solve certain incompatibilities but consumes CPU/GPU; do not enable it globally without capacity testing.

## 9. Observability

Capture (without secrets): source type, gateway ID, camera ID, session ID, selected output protocol, connection state, start/end time, error category, latency where reliable, bytes/bitrate where available.

Never log full source URL if it contains credentials or private path tokens.
