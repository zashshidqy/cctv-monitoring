# 09 — Role & Access Control

## 1. Security model

Gunakan **RBAC + store scope + optional per-user permission overrides**. Authorization selalu dilakukan di backend melalui Laravel Policies/Gates atau service authorization yang konsisten.

## 2. Roles

### Master Admin

- Full access ke seluruh store, camera, gateway, user, role, permission, alert configuration, dan audit log.
- Dapat mengubah access assignment.
- Harus dilindungi dengan autentikasi kuat dan akun terbatas.

### GM

- Global read/monitoring scope untuk seluruh store aktif.
- Dapat melihat store, metadata kamera, live view, dan alert.
- Hak acknowledge/resolve alert belum final. Default MVP: view-only untuk alert sampai keputusan owner dibuat.
- Tidak otomatis memiliki hak mengubah store/camera/user configuration.

### SV

- Hanya store yang ditugaskan.
- Dapat melihat store, metadata kamera, live view, dan alert dalam assigned store.
- Hak acknowledge/resolve alert belum final. Default MVP: view-only untuk alert sampai keputusan owner dibuat.
- Tidak dapat mengakses store lain melalui URL/API langsung.

### Staff

- Role cadangan.
- Tidak mendapatkan module permission operasional secara default.
- Master Admin memberikan permission per module dan store scope.
- Master Admin dapat memakai template permission atau konfigurasi per user.
- Akses minimum untuk login/profile/logout dapat diberikan sebagai bagian sistem, tetapi tidak mengimplikasikan akses kamera.

## 3. Permission catalog (draft)

### Monitoring

- `monitoring.view`
- `stores.view`
- `cameras.view`
- `cameras.live_view`
- `alerts.view`
- `alerts.acknowledge` (belum aktif untuk GM/SV tanpa keputusan)
- `alerts.resolve` (belum aktif tanpa keputusan)

### Administration

- `stores.create`, `stores.update`, `stores.deactivate`
- `cameras.create`, `cameras.update`, `cameras.deactivate`
- `camera_sources.manage`
- `gateways.view`, `gateways.manage`
- `users.view`, `users.create`, `users.update`, `users.deactivate`
- `permissions.manage`
- `audit_logs.view`
- `system_settings.manage`

Master Admin memiliki semua permission. Jangan memberikan permission administration kepada GM/SV/Staff tanpa kebutuhan yang terdokumentasi dan approval.

## 4. Store scope model

- GM: global scope (`all active stores`).
- SV: satu store secara default; data model boleh mendukung beberapa assignment jika kebutuhan organisasi berubah.
- Staff: store scope dikonfigurasi oleh Master Admin.
- Master Admin: global scope.

Store assignment harus memiliki effective date/status bila diperlukan. User nonaktif kehilangan akses segera.

## 5. Effective permission calculation

Urutan logika yang disarankan:

1. Pastikan user authenticated dan active.
2. Master Admin bypass hanya untuk hak internal yang eksplisit; catat audit untuk operasi sensitif.
3. Ambil role permissions.
4. Terapkan per-user grants/revocations bila sistem memakai overrides.
5. Terapkan store scope terhadap resource yang diminta.
6. Default deny jika tidak ada izin eksplisit.

Hindari konflik yang membingungkan antara role grant dan explicit deny. Tentukan precedence secara konsisten dan test.

## 6. Enforcement points

Terapkan authorization pada:

- Store list/search/show.
- Camera list/show.
- Snapshot URL.
- Playback session creation and refresh.
- Alert list/detail/action.
- Admin CRUD.
- Gateway configuration/test.
- Exports/downloads bila kelak ditambahkan.

## 7. Security tests

- SV tidak dapat membuka store ID lain.
- Staff tanpa permission tidak dapat mengakses endpoint walau URL diketahui.
- Staff hanya dapat membuka store yang ditugaskan.
- GM dapat melihat seluruh store tetapi tidak dapat melakukan admin mutation.
- User disabled tidak dapat membuka playback session.
- Session/token tidak tetap valid setelah permission dicabut atau masa berlaku berakhir sesuai kebijakan.
- Mengganti ID di request tidak dapat menyebabkan IDOR.
