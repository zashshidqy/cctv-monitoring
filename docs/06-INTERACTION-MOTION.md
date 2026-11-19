# 06 — Interaction & Motion Guidelines

## 1. Prinsip

Motion harus menjelaskan perubahan state, mempertahankan konteks, dan memberi feedback. Motion bukan dekorasi.

## 2. Timing baseline

| Interaction | Target duration |
|---|---:|
| Hover/focus feedback | 100–160 ms |
| Button press | 100–140 ms |
| Tooltip | 120–180 ms |
| Store popup | 160–220 ms |
| Explorer panel | 180–260 ms |
| Camera focus expand | 180–280 ms |
| Map fly-to | Sesuai jarak; singkat dan bisa dihentikan |

Nilai tersebut adalah starting point, bukan aturan kaku. Hindari animasi yang membuat tindakan terasa lambat.

## 3. Map interaction

- Marker hover: subtle scale/ring, jangan bounce.
- Marker selected: persistent selected ring.
- Cluster expand: map ease-to/fly-to yang tidak membuat mual.
- Pitch transition: interpolate/ease; jangan snap dari 0° ke 20°.
- User dapat mematikan Tilt View dan kembali ke 2D.

## 4. Panel transition

- Store popup menjadi Camera Explorer melalui expand/slide transition.
- Jangan menggunakan animasi morph rumit bila berisiko menurunkan performa.
- Simpan selectedStoreId dan selectedCameraId sebagai state eksplisit.
- Browser back/escape behavior harus konsisten.

## 5. Loading experience

### Initial load

- Tampilkan branded O!Save loading hanya ketika aplikasi benar-benar menunggu bootstrapping penting.
- Gunakan logo/aset resmi yang disediakan.
- Motif visual: garis rute tipis dan node merah yang terkait dengan map.
- Progress harus real atau indeterminate; jangan membuat percentage palsu.
- Jangan memberi artificial minimum delay.

### Map load/reload

- Gunakan map skeleton/placeholder dan status `Memuat peta...`.
- Jangan menghapus seluruh halaman jika hanya tile source yang reload.
- Pertahankan panel/map context bila memungkinkan.

### Camera load

- Player-level state: Preparing → Connecting → Playing.
- Jika gagal, tampilkan error yang dapat dipahami.
- Jangan pakai global splash untuk perpindahan kamera.

### Snapshot load

- Skeleton thumbnail dengan timestamp setelah berhasil.
- Jika gagal, tampilkan placeholder dan status snapshot unavailable.

## 6. Error and feedback

- Toast untuk aksi ringan/success/error singkat.
- Alert Center untuk insiden kamera.
- Form validation inline di field terkait.
- Error teknis gateway tidak boleh membocorkan URL, IP internal, atau secret.

## 7. Reduced motion

Hormati `prefers-reduced-motion`. Nonaktifkan/kurangi parallax, auto-fly, scale transition, dan animated decorative route. Semua fungsi harus tetap dapat digunakan.

## 8. Aceternity usage

Gunakan hanya jika komponen yang dipilih menambah kualitas interaksi. Jangan mengambil seluruh template/demo. Audit source, dependency, responsiveness, keyboard behavior, reduced motion, dan performance sebelum dipakai.
