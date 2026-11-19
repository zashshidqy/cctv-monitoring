# 01 — Product Requirements Document (PRD)

## 1. Tujuan

Menyediakan satu aplikasi terautentikasi untuk menemukan store O!Save pada map, melihat status kamera, dan memutar stream kamera sesuai hak akses pengguna.

## 2. Goals

- Pengguna dapat menemukan store melalui map dan search.
- Pengguna dapat melihat status store/kamera.
- Pengguna dapat membuka kamera dari store tanpa navigasi halaman yang membingungkan.
- Master Admin dapat mengelola store, camera, user, role, dan permission.
- Kamera yang tidak tersedia menghasilkan status/alert yang dapat ditindaklanjuti.
- Sistem dapat menerima beberapa jenis camera source melalui adapter yang terkontrol.

## 3. Non-goals MVP

- Public CCTV directory.
- Recording, archive playback, export rekaman.
- AI/video analytics atau face recognition.
- Automatic device discovery across the public internet.
- PTZ control kecuali kebutuhan dan otorisasi dibuktikan.
- Mobile app native.
- Integrasi vendor spesifik sebelum model perangkat diketahui.

## 4. User roles

Detail lengkap ada pada `09-ROLE-ACCESS-CONTROL.md`.

| Role | Cakupan |
|---|---|
| Master Admin | Semua data, semua store, semua pengaturan |
| GM | Semua store, monitor/read access |
| SV | Store yang ditugaskan |
| Staff | Tidak ada akses operasional secara default; permission dan store scope ditentukan Master Admin |

## 5. Functional requirements

### FR-01 Authentication

- Login menggunakan akun internal.
- Logout mengakhiri sesi.
- Password reset mengikuti kebijakan organisasi.
- Akun inactive/locked tidak dapat membuka monitoring atau stream.

### FR-02 Monitoring map

- Map menampilkan store yang diizinkan untuk user.
- Setiap store ditampilkan sebagai marker.
- Marker mendukung status Online, Partial, Offline, Unknown.
- Marker mendukung clustering saat zoom jauh.
- Search dapat mencari nama, kode, kota, atau alamat store.
- Filter status tersedia.
- Map default 2D; semi-3D pitch meningkat bertahap hingga target 15–20°.

### FR-03 Store popup

- Klik marker membuka popup/floating card.
- Menampilkan nama, kode, alamat ringkas, total kamera, jumlah Online/Unstable/Offline/Unknown.
- Tersedia aksi Explore Cameras.
- Popup tidak menjadi satu-satunya tempat untuk mengakses informasi penting.

### FR-04 Camera Explorer

- Panel floating terbuka tanpa meninggalkan map context.
- Menampilkan kamera milik store terpilih yang dapat diakses.
- Menampilkan area/nama, ID, status, dan preview bila tersedia.
- Preview snapshot harus menampilkan timestamp dan label Snapshot.
- Live stream tidak otomatis aktif untuk semua kamera.
- Gallery mendukung Dynamic Mosaic yang tetap mudah discan.

### FR-05 Camera Focus

- Klik kamera membuka fokus player.
- Player menyediakan loading, connecting, playing, reconnecting, offline, unsupported, dan error states.
- Pengguna dapat kembali ke gallery atau map.
- Stream dihentikan saat tidak lagi dibutuhkan.
- Fullscreen didukung.

### FR-06 Camera management

- Master Admin dapat create/read/update/deactivate camera.
- Camera harus terhubung ke tepat satu store aktif.
- Camera memiliki kode unik, nama, area, source type, gateway/source profile, dan status operasional.
- Credential tidak ditampilkan kembali setelah disimpan.
- Ada aksi Test Connection sebelum konfigurasi dipakai.

### FR-07 Store management

- Master Admin dapat create/read/update/deactivate store.
- Store memiliki kode unik, nama, alamat, city/region, latitude, longitude, dan status.
- Koordinat harus divalidasi.
- Store yang memiliki kamera/user assignment/alert historis tidak boleh dihapus permanen tanpa kebijakan retensi yang jelas; gunakan deactivation/archiving.

### FR-08 User and permission management

- Master Admin dapat mengelola akun, role, status, dan store assignment.
- GM memiliki global viewing scope.
- SV dibatasi oleh store assignment.
- Staff tidak mendapat module permission sampai diberikan.
- Permission check dilakukan di backend.

### FR-09 Camera health and alerts

- Sistem melakukan health check melalui gateway/adapter.
- Status tidak berubah Offline dari satu kegagalan singkat saja.
- Alert dibuat berdasarkan threshold yang dapat dikonfigurasi.
- Recovery dicatat sebagai event.
- Alert dapat dilihat berdasarkan scope user.

### FR-10 Audit log

- Catat perubahan user, role, permission, assignment, store, camera, source config, dan alert action.
- Secret/credential tidak boleh masuk audit payload.

## 6. Non-functional requirements

- Security: deny by default, server-side authorization, encrypted credentials, no direct camera exposure.
- Performance: initial map tidak memuat live streams; query dan marker di-cluster; preview lazy-loaded.
- Reliability: failure handling untuk gateway, camera, tile service, dan stream playback.
- Accessibility: keyboard navigation, focus states, contrast, reduced motion.
- Maintainability: adapter-based connectivity dan modular domain services.
- Observability: structured logs, metrics, health endpoints, alerting untuk infrastructure.

## 7. Prioritas MVP

**P0:** auth, RBAC, store CRUD, camera CRUD, map, marker, popup, Camera Explorer, single camera player, RTSP/ONVIF/NVR PoC, health checks, alerts.  
**P1:** HLS source, WebRTC source, snapshot/MJPEG adapters, alert history, staff custom permission, audit log.  
**P2:** vendor integrations, multiple live stream layout, recording playback, external notifications.

P0/P1 dapat disesuaikan setelah audit perangkat fisik.

## 8. Success metrics

- Waktu untuk menemukan store dan membuka kamera.
- Persentase konfigurasi kamera yang berhasil dites.
- False offline alert rate.
- Waktu rata-rata status berubah setelah gangguan terdeteksi.
- Error rate playback per source type.
- Penggunaan bandwidth dan concurrent stream.
- Jumlah akses yang ditolak karena store scope (sebagai security signal, bukan target untuk diminimalkan tanpa analisis).

Jangan memasang angka target sebelum baseline lapangan tersedia.
