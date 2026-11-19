# 19 — Decisions & Open Questions

## 1. Accepted product decisions

| ID | Decision | Status |
|---|---|---|
| D-001 | Internal O!Save multi-store CCTV monitoring web app | Accepted |
| D-002 | Map-first interface, store marker represents store | Accepted |
| D-003 | Hybrid interaction: Store Popup → Camera Explorer → Camera Focus | Accepted |
| D-004 | Modern light neumorphism | Accepted |
| D-005 | shadcn/ui foundation; Aceternity selectively | Accepted |
| D-006 | O!Save red/white identity; exact tokens pending official asset validation | Direction accepted; tokens provisional |
| D-007 | MapLibre candidate, 2D default and subtle pitch up to 15–20° | Direction accepted; PoC needed |
| D-008 | Master Admin, GM, SV, Staff roles | Accepted |
| D-009 | GM global store visibility; SV assigned store only | Accepted |
| D-010 | Staff access configured by Master Admin; default no operational permission | Accepted |
| D-011 | Offline camera status and in-app alert | Accepted |
| D-012 | Several camera connection methods with simple onboarding | Accepted |
| D-013 | Do not autoplay all streams; camera-on-demand | Accepted |

## 2. Open questions — must be answered before production

### Device inventory

- What camera/NVR/DVR brands and models are in stores?
- Firmware versions?
- Does each camera support ONVIF? Which profile?
- Are substreams available?
- Which codec and resolution are currently used?

### Network

- Can central server reach each store LAN through private routing/VPN?
- Are stores isolated behind NAT?
- Is outbound connection from store allowed?
- Is edge gateway hardware/software permitted?
- Approximate upload/download bandwidth per store?

### Scale

- Number of stores now and expected growth?
- Number of cameras per store?
- How many concurrent viewers?
- How many simultaneous streams per user?

### User policy

- Can GM acknowledge alerts?
- Can SV acknowledge alerts?
- Who may mark an incident operationally closed?
- Should Staff use permission templates, per-user permissions, or both? Current recommendation: both.

### Operations

- Is recorded playback required?
- Is remote PTZ required?
- Is external notification (email/WhatsApp) required?
- Required audit/log retention?
- Who owns credential rotation and device maintenance?

### Brand and map

- Provide official O!Save logo/vector assets and approved brand color values.
- Confirm map tile provider, budget, SLA, attribution.
- Confirm default geographic extent.

## 3. Technical ADRs to create

- ADR-001: Application stack and frontend integration.
- ADR-002: Central vs edge gateway deployment.
- ADR-003: Media gateway and supported device/source matrix.
- ADR-004: Map tile provider and style.
- ADR-005: Alert threshold and acknowledgment policy.
- ADR-006: Permission precedence and Staff templates.

## 4. Current recommendations

- Laravel + Inertia React + TypeScript if the project is new and no existing stack constraint exists.
- MapLibre GL JS with a production tile provider.
- MediaMTX as a candidate only after device PoC.
- Edge gateway if store networks are isolated.
- GM/SV alert actions remain view-only until policy is agreed.
- Staff uses reusable templates plus individual adjustment, with zero operational permission by default.
