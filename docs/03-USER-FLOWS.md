# 03 — User Flows

## Flow A — Login dan membuka Monitoring

1. User membuka aplikasi.
2. Jika belum authenticated, arahkan ke Login.
3. Backend memverifikasi akun dan statusnya.
4. Sistem memuat role dan effective permissions.
5. User diarahkan ke Monitoring jika memiliki permission yang sesuai; jika tidak, tampilkan Access Restricted yang menjelaskan langkah menghubungi Master Admin.
6. Map hanya menerima store yang authorized.

## Flow B — Cari dan pilih store

1. User mengetik nama/kode/kota store.
2. Search result menampilkan store yang dapat diakses.
3. User memilih hasil.
4. Map melakukan fly-to/ease-to ke marker tanpa gerakan berlebihan.
5. Store popup terbuka.
6. Popup memperlihatkan summary kamera dan status.

## Flow C — Marker ke Camera Explorer

1. User klik marker.
2. Popup ringkas muncul.
3. User memilih Explore Cameras.
4. Popup berkembang menjadi Camera Explorer panel.
5. Panel memuat metadata kamera terlebih dahulu.
6. Snapshot thumbnail dimuat lazy bila diizinkan.
7. Live stream belum aktif sampai kamera dipilih.

## Flow D — Buka live camera

1. User memilih card kamera.
2. Backend memeriksa permission dan store scope.
3. Backend membuat playback session/short-lived token.
4. Frontend menampilkan connecting state.
5. Player memulai WebRTC/HLS/adapter output yang dipilih server.
6. Jika gagal, tampilkan error category dan tindakan aman (Retry, View details).
7. Saat user mengganti/menutup kamera, stream session dilepas.

## Flow E — Store Supervisor (SV)

1. SV login.
2. Backend memberikan hanya store assignment SV.
3. Map hanya menampilkan store yang ditugaskan.
4. Search, API, popup, metadata, camera, alert, dan playback hanya berlaku untuk store tersebut.
5. Percobaan membuka ID store lain harus ditolak server-side.

## Flow F — General Manager (GM)

1. GM login.
2. GM melihat seluruh store aktif.
3. GM dapat mencari/filter/menjelajahi semua store.
4. GM dapat melihat kamera dan alert sesuai permission global viewing.
5. Aksi acknowledge/resolution alert belum diputuskan; default jangan diberikan sebelum disepakati.

## Flow G — Staff onboarding

1. Master Admin membuat/mengaktifkan akun dengan role Staff.
2. Akun Staff secara default memiliki nol module permission operasional.
3. Master Admin menetapkan satu atau beberapa store scope.
4. Master Admin memilih permission module melalui template atau konfigurasi individual.
5. Sistem menampilkan ringkasan effective access sebelum disimpan.
6. Perubahan tercatat di audit log.

## Flow H — Tambah kamera

1. Master Admin memilih store.
2. Pilih Add Camera.
3. Isi metadata kamera.
4. Pilih connection method: ONVIF, RTSP, NVR/DVR channel, HLS, WebRTC, MJPEG, Snapshot, atau adapter lain yang tersedia.
5. Wizard menunjukkan field yang relevan; jangan menampilkan semua field teknis sekaligus.
6. Simpan credential melalui secret-safe field.
7. Test Connection dijalankan melalui backend/gateway.
8. Sistem menunjukkan hasil, latency/diagnostic ringkas, dan codec compatibility bila tersedia.
9. Admin menyimpan konfigurasi hanya setelah hasil dipahami.

## Flow I — Camera offline

1. Health checker mengumpulkan hasil gagal berulang sesuai threshold.
2. Status kamera berubah menjadi Offline.
3. Alert event dibuat satu kali untuk insiden yang sama.
4. User yang authorized melihat in-app notification/alert center.
5. Kamera kembali dapat dijangkau.
6. Sistem membuat recovery event dan memperbarui status; alert history tetap dipertahankan.

## Flow J — Master Admin mengelola store/camera

Semua mutasi harus menggunakan validation, policy, audit logging, dan deactivation/archive bila data telah memiliki histori operasional.
