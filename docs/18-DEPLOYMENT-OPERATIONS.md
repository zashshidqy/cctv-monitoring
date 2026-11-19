# 18 — Deployment & Operations

## 1. Environments

- Local development.
- Staging with test camera/NVR and representative network.
- Production.

Production secrets must not be copied into local docs or repository.

## 2. Deployment components

- Web application (Laravel + frontend build).
- Database (MySQL/MariaDB).
- Queue worker/scheduler.
- Redis if selected.
- Media gateway service(s).
- Edge gateway agent(s), if network survey requires them.
- Map tile service/provider.
- Reverse proxy/TLS.
- Logging/metrics/backup services.

## 3. Configuration

Use environment variables/secret manager for:

- Database credentials.
- App key/session secrets.
- Redis credentials.
- Gateway API credentials.
- Playback signing key.
- Map style/tile provider URL and access token.
- Health-check intervals/thresholds.
- Stream concurrency limits.

Never commit `.env`, credentials, RTSP URLs with userinfo, or signed playback URLs.

## 4. Operational health

Monitor:

- Web app health.
- Queue backlog/worker health.
- Database connections/backup status.
- Gateway heartbeat and version.
- Camera health check duration/failure rate.
- Active playback sessions.
- Bandwidth and gateway CPU/memory.
- Map tile service errors.

## 5. Backup

- Database backup schedule to be approved.
- Test restore regularly.
- Preserve alert/audit retention according to policy.
- Backup encrypted configuration only using approved process.
- Do not store video recordings unless separately approved and planned.

## 6. Release strategy

- Deploy to staging first.
- Run migrations with backup and rollback plan.
- Validate login, permissions, map, one stream, alerts, and admin workflows.
- Roll out by pilot store before multi-store expansion.

## 7. Pilot

Begin with one store and a small subset of cameras. Measure network usage and playback reliability before enabling all stores. Expand in controlled groups.
