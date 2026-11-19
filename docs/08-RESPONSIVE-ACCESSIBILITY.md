# 08 — Responsive & Accessibility Guidelines

## 1. Primary device

MVP diutamakan untuk desktop/laptop operasional. Tablet dan mobile tetap harus usable, tetapi multi-stream view pada mobile bukan prioritas.

## 2. Layout behavior

### Desktop (sekitar 1280px ke atas)

- Map full workspace.
- Store Popup dekat marker.
- Camera Explorer floating panel dari kanan.
- Camera Focus dapat memperluas area player.

### Tablet (sekitar 768–1279px)

- Header lebih ringkas.
- Explorer dapat menjadi sheet/panel lebar.
- Popup marker dapat berpindah ke bottom sheet bila viewport sempit.
- Hindari panel menutupi seluruh kontrol map.

### Mobile (di bawah sekitar 768px)

- Map tetap tersedia namun kontrol lebih sederhana.
- Store popup menjadi bottom sheet.
- Camera Explorer menjadi full-height sheet atau halaman stack.
- Default playback satu kamera saja.
- Camera focus menggunakan player responsif.
- Tabel admin dapat berubah menjadi list/card atau horizontal scroll yang terkontrol.

Breakpoint final mengikuti layout nyata, bukan angka semata.

## 3. Keyboard

- Seluruh aksi penting dapat dijalankan keyboard.
- Focus order logis.
- Focus-visible jelas dan tidak hanya berupa shadow lembut.
- Escape menutup dialog/panel sesuai pola yang konsisten.
- Map memiliki alternatif search/list untuk pengguna yang kesulitan mengoperasikan peta dengan keyboard.

## 4. Screen reader

- Tombol ikon memiliki accessible name.
- Status marker memiliki teks/aria label seperti `Store A, Partial, 2 cameras offline`.
- Update alert diumumkan secara wajar; hindari live region yang terlalu sering.
- Video player memiliki title/label kamera.

## 5. Contrast and visual

- Target kontras teks normal minimal 4.5:1 bila sesuai WCAG AA.
- Teks status tidak boleh hanya dibedakan lewat warna.
- Neumorphism tidak boleh menghapus border/focus state.
- Klik target interaktif harus nyaman disentuh.

## 6. Motion

Hormati `prefers-reduced-motion`. Sediakan kontrol 2D bila tilt map atau motion membuat pengguna tidak nyaman.

## 7. Testing

Uji minimum: Chrome desktop, Edge desktop bila digunakan organisasi, Safari/iOS bila perangkat mobile termasuk cakupan. Verifikasi zoom browser 100%, 125%, dan 150%.
