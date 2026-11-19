# 10 — Camera Connectivity Guide

## 1. Tujuan

Membuat admin dapat mendaftarkan kamera dengan pilihan koneksi yang cukup luas, tetapi wizard tetap mudah dipahami. Dukungan setiap metode harus diverifikasi melalui PoC dengan perangkat nyata.

## 2. Bedakan device integration, source protocol, dan browser playback

Jangan mencampur tiga lapisan berikut:

1. **Device integration:** cara mengenali/mengatur perangkat, misalnya ONVIF atau vendor integration.
2. **Source protocol:** cara gateway menerima video, misalnya RTSP, RTMP, SRT, HLS, atau MJPEG.
3. **Browser playback:** cara browser menerima video, umumnya WebRTC atau HLS, atau MJPEG untuk kebutuhan tertentu.

NVR/DVR adalah recorder/perangkat, bukan protokol.

## 3. Koneksi yang direncanakan

| Option | Penjelasan UI | Peran teknis | Status |
|---|---|---|---|
| ONVIF Discovery | Temukan perangkat yang kompatibel | Discovery/profile/device interoperability; dapat membantu mengambil stream URI | MVP PoC |
| Manual RTSP | Masukkan sumber stream kamera | Source input ke media gateway | MVP |
| NVR/DVR | Tambahkan recorder dan channel | Channel source biasanya memakai ONVIF/RTSP atau adapter vendor | MVP PoC |
| HLS URL | Gunakan URL `.m3u8` yang tersedia | Source input atau playback URL, bergantung origin dan auth | P1 |
| WebRTC Endpoint | Gunakan endpoint WebRTC yang tersedia | Source/playback integration sesuai gateway | P1 |
| MJPEG URL | Gunakan image multipart stream | Preview/playback khusus | P1 |
| Snapshot URL | Ambil gambar berkala | Bukan live video | P1 |
| Vendor Adapter | Integrasi API/protokol vendor | Bergantung model dan SDK/API | Later |
| Custom Gateway | Sumber dari gateway terkelola | Adapter internal | Later |

ONVIF conformance perlu diperiksa berdasarkan profile dan registered product; istilah “ONVIF compatible” saja tidak menjamin seluruh fitur. Lihat direktori dan profile resmi ONVIF.

## 4. Camera onboarding wizard

### Step 1 — Metadata

- Store.
- Camera code (unik dalam sistem; boleh global unique untuk memudahkan operasi).
- Camera name.
- Area/location label (contoh: Loading Dock, Receiving, Entrance).
- Notes (optional).
- Optional floor/zone metadata jika tersedia.

### Step 2 — Connection method

Tampilkan pilihan dalam bahasa operasional. Sediakan “I’m not sure” yang mengarahkan ke opsi discovery atau panduan admin, bukan membuat asumsi perangkat.

### Step 3 — Connection settings

Field muncul sesuai metode. Contoh RTSP: host, port, path/profile, username/password. Jangan log atau echo secret setelah submit. Gunakan password manager-style input.

### Step 4 — Test connection

- Test dijalankan server-side melalui gateway/worker.
- Timeout terbatas.
- Tampilkan diagnostic non-sensitive: source reachable, authentication result (tanpa detail), codec/container, last response, gateway route.
- Jangan mengungkap alamat internal kepada viewer.

### Step 5 — Playback compatibility

- Pilih output otomatis secara default.
- Jika perlu, admin dapat memilih preferensi WebRTC/HLS berdasarkan PoC.
- Test playback melalui browser/session yang authorized.

### Step 6 — Review and save

Tampilkan metadata dan metode koneksi tanpa memperlihatkan password/secret. Save hanya oleh permission `camera_sources.manage`.

## 5. Device/source notes

### ONVIF

ONVIF adalah framework interoperabilitas profile-based. Profile video yang umum antara lain S, T, G, M sesuai kemampuan dan use case; dukungan aktual tergantung product/profile. Gunakan ONVIF untuk discovery, capability/profile, dan memperoleh stream URI bila perangkat mendukungnya. ONVIF bukan player format di browser.

### RTSP

RTSP source umumnya tidak dapat diputar langsung oleh browser. Gateway perlu menerima RTSP dan menyediakan output yang browser-compatible. Credential/path disimpan server-side.

### NVR/DVR

Satu recorder dapat memiliki banyak channel. Model data dapat membuat satu gateway/device dan banyak camera/channel records. Pastikan channel ID/profile sesuai model.

### HLS

URL HLS tidak otomatis berarti bebas CORS/auth/codec issue. Test browser playback, token handling, and segment access.

### WebRTC

Periksa signaling, ICE/STUN/TURN/network requirements, codec support, NAT/firewall, dan TLS. Jangan menampilkan “connected” hanya karena endpoint URL disimpan.

### MJPEG

Cocok untuk beberapa perangkat/snapshot-like feeds, tetapi bandwidth dapat tinggi. Jangan jadikan fallback universal.

### Snapshot

Perbarui dengan interval yang dapat dikonfigurasi. Selalu beri label Snapshot dan timestamp; jangan menyebutnya LIVE.

## 6. Extensibility

Gunakan adapter/driver registry, misalnya:

- `OnvifDiscoveryAdapter`
- `RtspSourceAdapter`
- `HlsSourceAdapter`
- `WebRtcSourceAdapter`
- `MjpegSourceAdapter`
- `SnapshotSourceAdapter`
- `VendorXAdapter` (hanya setelah kebutuhan terbukti)

Setiap adapter memiliki capability declaration, validation, test, health probe, dan playback handoff.

## 7. Compatibility matrix

Sebelum produksi, buat matrix berdasarkan vendor, model, firmware, ONVIF profile, codec, resolution, source protocol, tested gateway version, browser output, and notes. Jangan mengklaim dukungan perangkat tanpa hasil test.
