# 15 — Security & Privacy

## 1. Scope

CCTV is sensitive operational data. Treat live video, snapshots, camera metadata, store assignments, and connection credentials as protected internal information.

## 2. Authentication

- Use secure session-based authentication or an approved identity provider.
- Enforce HTTPS.
- Use secure, HttpOnly, SameSite cookies where session auth is used.
- Implement CSRF protection for state-changing requests.
- Rate-limit login, password reset, and sensitive endpoints.
- Use strong password hashing supported by framework defaults.
- Consider MFA for Master Admin as a production requirement.

## 3. Authorization

- Enforce backend RBAC and store scope for all resource and media requests.
- Apply deny-by-default.
- Protect against IDOR by testing unauthorized resource IDs.
- Authorization must be checked again when creating/renewing playback sessions.
- Permission revocation should prevent new sessions and define how active sessions expire/revoke.

## 4. Camera credentials

- Encrypt credentials at rest using application encryption or a dedicated secret manager.
- Never send secrets to frontend.
- Never print RTSP URLs that contain userinfo/password in logs.
- Mask secret fields in admin UI; do not return stored secret value after save.
- Restrict who can test/update source settings.
- Rotate credentials when staff/admin access changes or compromise is suspected.

## 5. Network security

- Do not expose camera/NVR ports directly to the public internet.
- Prefer private connectivity/VPN or authenticated outbound edge gateway.
- Segment camera VLAN/network from general store devices.
- Restrict gateway egress/ingress to approved destinations.
- Do not implement arbitrary URL fetching without SSRF defenses.
- Block unsafe schemes and unexpected destinations; use allowlists where possible.
- Validate DNS resolution and IP ranges at connection time to mitigate DNS rebinding/SSRF.

## 6. Playback security

- Use short-lived, scoped playback tokens.
- Token should be limited to user, camera, permission, and expiry.
- Do not place long-lived credentials in query strings.
- Do not enable anonymous public playback.
- Apply concurrency and session expiry policy.
- Protect snapshots with the same authorization as video.

## 7. Audit

Audit at least:

- Login/session security events.
- User creation/deactivation.
- Role and permission changes.
- Store assignment changes.
- Store/camera/source configuration changes.
- Gateway configuration changes.
- Alert acknowledgement or manual closure.

Redact secrets and avoid unnecessary video content in logs.

## 8. Privacy and operational governance

- Confirm internal authorization and policy for viewing each store's cameras.
- Display that the app is for authorized internal monitoring.
- Define who may view which cameras and for what operational purpose.
- Define retention of audit logs and alert metadata.
- Do not add face recognition, identity inference, or employee productivity scoring as an assumed feature.
- Video recording/download/export is out of MVP and requires a separate approval, policy, and access design.

## 9. Backup and incident response

- Back up database and configuration securely.
- Do not back up plaintext secrets outside approved encrypted mechanism.
- Define credential rotation and incident response for compromised accounts/gateways.
- Test restore procedure.
