# 14 — Alerts & Camera Health Monitoring

## 1. Camera health state

- `online`: successful source/gateway probe within expected window.
- `unstable`: intermittent failures, latency/packet/connectivity degradation, or flapping.
- `offline`: repeated failures exceed configured threshold.
- `unknown`: no reliable test completed, gateway unavailable, or status cannot be determined.

Do not equate “record exists” with Online. A health check must verify an actual path to the configured source through the intended gateway.

## 2. Detection strategy

- Probe through gateway/worker, not from browser.
- Use configurable interval, timeout, and consecutive-failure threshold.
- Avoid creating an alert after one transient failure.
- Track first failure, last failure, last success, failure count, and gateway reachability.
- If gateway itself is offline, distinguish gateway outage from every camera independently failing. Avoid a flood of identical per-camera alerts; group/suppress dependent symptoms.

Threshold values should be configured after a network baseline. Starting values can be tested in staging but must not be treated as final production SLA.

## 3. Alert lifecycle

Recommended statuses:

- `active`: issue currently detected.
- `acknowledged`: authorized user has seen/accepted responsibility, if acknowledgement permission is enabled.
- `recovered`: health condition returned to normal; this is a system recovery event.
- `closed` (optional): human operational closure, only if business requires and role policy is approved.

Do not conflate acknowledgement with technical recovery. Recovery should be driven by health checks, not by clicking a button.

## 4. Notification behavior

- In-app toast for a newly detected issue.
- Notification Center maintains active/recovered event history.
- Badge shows unread/new items, not total historical events.
- Group multiple camera incidents by store where helpful, while retaining camera-level detail.
- Recovery notification when camera returns Online.
- Avoid repetitive notification spam for the same incident.

External email/WhatsApp/push delivery is out of MVP until channel, recipient, policy, and cost are approved.

## 5. Permissions

- Master Admin can view all alerts and configure thresholds.
- GM sees all alerts by default.
- SV sees alerts only for assigned stores.
- Staff sees alerts only if `alerts.view` is granted and within store scope.
- GM/SV acknowledge/resolve capability is undecided. Do not expose action before product owner confirms.

## 6. UI requirements

Alert item contains store, camera, issue type, detected time, last known success, current state, and authorized action. Do not expose internal IP, RTSP source string, username, or password.

## 7. Operational metrics

- Time to detect.
- Time to recovery.
- False positive rate.
- Alert volume by gateway/store/source type.
- Camera flapping count.
- Gateway health.
