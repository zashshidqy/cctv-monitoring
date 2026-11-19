# 05 — UI/UX Specification

## 1. Product experience

The interface is a **map-first monitoring workspace**. User tidak masuk ke dashboard KPI generik. User langsung memahami lokasi store, kondisi kamera, dan cara membuka live view.

## 2. Monitoring screen

### Header

- O!Save Monitor logo/wordmark.
- Global search.
- Alert/notification trigger with unread count.
- User profile menu.
- Admin entry hanya untuk Master Admin atau user yang memiliki permission eksplisit.

Header tidak boleh tinggi atau penuh navigasi.

### Map canvas

- Menempati area utama.
- Menampilkan store marker dan cluster.
- Store marker menunjukkan ringkas status store.
- Search selection memindahkan map dengan easing.
- Map attribution selalu terlihat.
- Controls: zoom, reset bearing/pitch, 2D/Tilt toggle.

### Store marker

- Satu marker = satu store.
- Marker visual konsisten; status menggunakan semantic accent.
- Hover/focus menampilkan tooltip nama/kode.
- Click membuka Store Popup.
- Selected marker memiliki outline/ring yang jelas.

### Store popup

Menampilkan:

- Nama store dan store code.
- Kota/alamat ringkas.
- Overall store status.
- Total camera count.
- Count Online, Unstable, Offline, Unknown.
- Alert summary bila ada insiden aktif.
- Primary action: Explore Cameras.
- Close control.

Popup harus tetap berfungsi pada tepi viewport; gunakan auto-position/anchoring dan fallback ke panel jika ruang tidak cukup.

## 3. Camera Explorer

### Panel behavior

- Dibuka dari Store Popup.
- Muncul dari kanan pada desktop.
- Map tetap terlihat di belakang.
- Panel memiliki ukuran yang nyaman dan dapat diperluas.
- Header menampilkan nama store dan status ringkas.
- Ada search/filter area camera.

### Camera card

- Preview image/snapshot bila tersedia.
- Nama kamera dan camera code.
- Area/lokasi kamera.
- Status dan last-seen.
- Jika snapshot, tampilkan label Snapshot serta waktu update.
- Jika offline, tampilkan offline visual state; jangan gunakan black screen.

### Dynamic Mosaic

Dynamic mosaic adalah komposisi visual, bukan layout acak. Aturan:

- Jumlah kamera sedikit: susunan seimbang dengan satu focal card bila sesuai.
- Kamera lebih banyak: gunakan responsive grid/mosaic yang predictable.
- User tetap dapat menemukan nama dan status setiap kamera.
- Jangan mengubah ukuran card terus-menerus tanpa tindakan user.
- Jangan auto-play semua kamera.

## 4. Camera Focus

- Memperbesar satu video sebagai fokus utama.
- Background/player surface dark neutral.
- Nama kamera, store, area, dan status terlihat.
- Kontrol: play/retry, mute bila audio memang ada dan diizinkan, fullscreen, close/back, pilih kamera lain.
- Tampilkan latency atau connection quality hanya bila datanya nyata dan dapat diukur.
- Error state menyediakan pesan yang dapat dipahami; diagnostic teknis hanya untuk Admin.

## 5. Alert Center

- Daftar alert dikelompokkan berdasarkan New/Active, Acknowledged (jika action diaktifkan), dan Recovered/History.
- Setiap item menampilkan store, camera, waktu, status, dan ringkasan penyebab.
- Klik alert membuka detail kamera/store sesuai access scope.
- Alert tidak boleh memaksa navigasi keluar dari konteks secara tidak perlu.
- Aksi acknowledge/resolution menunggu keputusan role policy.

## 6. Admin screens

### Admin overview

Ringkas: total store, camera, status koneksi, active incidents, gateway health. Hindari chart dekoratif yang tidak memiliki tindakan operasional.

### Store Management

Table/search/filter; create/edit/deactivate. Form berisi code, name, address, region/city, latitude, longitude, status, notes.

### Camera Management

List dengan store, camera ID, area, connection type, derived status, last check. Form wizard dibagi metadata → connection → test → review/save.

### User Management

List user, role, active status, assigned stores. Detail user menampilkan effective permissions dan permission source.

### Roles & Permissions

Master Admin mengatur Staff permissions; template role dapat digunakan ulang. Permission summary harus menunjukkan module access dan store scope sebelum save.

### Gateway Management

Menampilkan edge/central gateway, store mapping, connectivity, version, heartbeat, dan last seen. Secret/token gateway tidak pernah ditampilkan.

## 7. Authentication screens

- Login bersih dengan brand mark dan satu panel form.
- Jangan tampilkan ilustrasi stok yang tidak relevan.
- Kesalahan login tidak mengungkap apakah username terdaftar.
- Session expired menampilkan penjelasan dan jalur login ulang.

## 8. Global states

Setiap halaman/komponen data harus memiliki:

- Loading/skeleton.
- Empty state yang menjelaskan apa yang belum tersedia.
- Error state dan retry yang aman.
- Permission denied state.
- Offline/unknown state bila relevan.
- Success confirmation untuk mutasi admin.

## 9. Copywriting

Gunakan bahasa ringkas dan operasional. Default bahasa UI dapat ditetapkan saat implementasi; rekomendasi awal Bahasa Indonesia untuk pengguna internal, dengan istilah protokol/teknis tetap dalam English jika lazim. Konsisten dan jangan mencampur bahasa secara acak.
