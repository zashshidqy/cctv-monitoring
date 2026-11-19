# 00 — Project Overview

## 1. Ringkasan

**O!Save Monitor** adalah aplikasi web internal untuk melihat dan memantau CCTV dari banyak store O!Save dalam satu interface. Sistem berpusat pada peta interaktif. Setiap marker mewakili satu store; kamera dikelola sebagai bagian dari store.

## 2. Product vision

Membuat pengguna yang memiliki izin dapat menemukan store, memahami status kamera di store tersebut, dan membuka live view dengan sesedikit mungkin langkah.

## 3. Product statement

> Find a store. Explore its cameras. Monitor what matters.

## 4. Prinsip produk

1. **Map-first:** map adalah orientasi utama untuk menemukan store.
2. **Store-centric:** store adalah unit navigasi; kamera menjadi child resource.
3. **Camera-on-demand:** stream baru aktif ketika diminta pengguna.
4. **Simple for operators:** form koneksi memberikan pilihan yang mudah dipahami, sementara detail teknis ditangani backend/gateway.
5. **Secure by default:** akses kamera mengikuti role dan store scope.
6. **Operational clarity:** status, offline alert, dan recovery mudah dibedakan.
7. **Performance-aware:** map dan video tidak boleh membebani browser dengan memuat semuanya sekaligus.

## 5. Pengguna utama

- **Master Admin:** mengelola sistem, seluruh store, kamera, user, dan permission.
- **GM:** memantau seluruh store dan CCTV.
- **SV:** memantau store tempat ia ditugaskan.
- **Staff:** role cadangan; akses module dan store scope diberikan oleh Master Admin. Default tidak memiliki izin operasional.

## 6. Pengalaman inti

`Login → Monitoring Map → Select Store Marker → Store Popup → Camera Explorer → Camera Focus`

Pengguna dapat kembali ke map tanpa kehilangan store context.

## 7. Batasan produk

MVP bukan VMS/NVR replacement. Produk ini tidak wajib menyediakan recording, playback rekaman, AI analytics, face recognition, intrusion detection, atau inventory integration. Recording/history playback adalah keputusan fase selanjutnya.

## 8. Asumsi yang wajib divalidasi

- Semua kamera yang dimonitor adalah milik/berada dalam pengelolaan organisasi dan pengguna memiliki otorisasi.
- Data store, koordinat, daftar kamera, perangkat, model, dan credential tersedia dari pihak operasional/IT.
- Konektivitas antar-store belum diketahui.
- Map tile provider harus dipilih berdasarkan SLA, biaya, lisensi, dan atribusi.
- Warna O!Save pada dokumen adalah token visual awal, bukan brand manual resmi.
