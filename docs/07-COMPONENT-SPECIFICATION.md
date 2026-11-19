# 07 — Component Specification

## 1. Component principles

- shadcn/ui menjadi starting primitives; komponen disalin dan dimiliki repository.
- Custom component dibuat untuk pola domain O!Save Monitor.
- Aceternity UI hanya dipakai pada motion/interaction terpilih.
- Setiap komponen domain menerima typed props dan state yang jelas.

## 2. Component inventory

### App shell

- `AppHeader`
- `BrandMark`
- `UserMenu`
- `AdminNavigation`
- `MonitoringWorkspace`

### Map

- `StoreMap`
- `StoreMarker`
- `StoreCluster`
- `MapControls`
- `MapStyleAttribution`
- `MapSearch`
- `MapStatusLegend`

### Store

- `StorePopup`
- `StoreStatusSummary`
- `StoreCameraSummary`
- `StoreSearchResult`

### Camera

- `CameraExplorerPanel`
- `CameraMosaic`
- `CameraCard`
- `CameraThumbnail`
- `CameraStatusBadge`
- `CameraPlayer`
- `CameraFocusHeader`
- `CameraConnectionState`
- `SnapshotPreview`

### Alerts

- `AlertBell`
- `AlertCenterPanel`
- `AlertListItem`
- `AlertDetail`
- `AlertStatusBadge`
- `RecoveryNotice`

### Admin

- `StoreTable` / `StoreForm`
- `CameraTable` / `CameraWizard`
- `UserTable` / `UserForm`
- `PermissionMatrix`
- `StoreScopeSelector`
- `GatewayTable`
- `ActivityLogTable`

### Shared primitives

Button, Input, Select, Dialog, Sheet, Popover, Tabs, Dropdown Menu, Tooltip, Toast/Sonner, Badge, Skeleton, Table, Form, Alert, Command, Checkbox, Switch, Separator.

## 3. CameraCard contract (conceptual)

Required data:

- `id`, `code`, `name`, `areaLabel`, `status`, `lastCheckedAt`.
- `previewType`: `snapshot | unavailable | none`.
- `snapshotUrl` must be a short-lived authorized URL, never a raw camera source.
- `isSelected`, `onSelect`.

Never accept RTSP credential/source string as a prop.

## 4. StoreMarker contract (conceptual)

Required data:

- `storeId`, `label`, `latitude`, `longitude`, `status`, `cameraCounts`.
- Data is already scoped by backend.
- Marker component does not decide authorization.

## 5. CameraPlayer contract (conceptual)

- Receives a short-lived playback session, output protocol, playback URL/token, allowed playback options.
- Handles state events: connecting, playing, stalled, ended, error.
- Calls backend to release session on unmount/close when feasible.
- Does not know the source RTSP/ONVIF credential.

## 6. Design state coverage

Every component must be reviewed for default, hover, focus-visible, active, disabled, loading, empty, error, and permission states as applicable.

## 7. Naming

Use domain-specific names (`CameraStatusBadge`) rather than generic wrappers with unclear semantics (`FancyCard3`). Avoid duplicate components with slightly different styling.
