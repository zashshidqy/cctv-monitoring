# O!Save Monitor — Documentation Pack

**Versi dokumen:** 1.0.0  
**Tanggal:** 20 November 2026  
**Status:** Product & design baseline; beberapa keputusan infrastruktur masih perlu validasi lapangan.

## Tujuan paket

Paket ini menjadi sumber acuan utama untuk product owner, designer, developer, QA, dan AI coding agent yang membangun **O!Save Monitor**, aplikasi web internal untuk memantau CCTV dari banyak store O!Save.

Produk menggunakan pengalaman **map-first** yang terinspirasi dari Trafik.live, tetapi bukan aplikasi publik. Sistem harus memerlukan autentikasi dan membatasi data serta live stream berdasarkan role dan store assignment.

## Cara menggunakan dokumen

1. Baca `AGENTS.md` sebelum mengubah atau membuat kode.
2. Baca `docs/00-PROJECT-OVERVIEW.md` dan `docs/01-PRD.md` untuk memahami produk.
3. Gunakan `docs/04-DESIGN-SYSTEM.md` dan `docs/05-UI-UX-SPECIFICATION.md` sebagai acuan visual dan interaksi.
4. Gunakan dokumen arsitektur, streaming, RBAC, keamanan, serta data model sebelum membangun backend.
5. Kerjakan backlog berdasarkan `docs/21-IMPLEMENTATION-BACKLOG.md` dan perbarui statusnya.
6. Validasi setiap hasil terhadap `docs/20-TESTING-ACCEPTANCE.md`.

## Struktur dokumen

| File | Isi |
|---|---|
| `AGENTS.md` | Instruksi kerja untuk AI coding agent |
| `00-PROJECT-OVERVIEW.md` | Ringkasan produk, tujuan, prinsip, asumsi |
| `01-PRD.md` | Product Requirements Document dan MVP |
| `02-INFORMATION-ARCHITECTURE.md` | Struktur halaman dan navigasi |
| `03-USER-FLOWS.md` | Alur pengguna utama |
| `04-DESIGN-SYSTEM.md` | Design tokens, palet warna, neumorphism |
| `05-UI-UX-SPECIFICATION.md` | Spesifikasi halaman dan UX |
| `06-INTERACTION-MOTION.md` | Motion, loading, transisi, feedback |
| `07-COMPONENT-SPECIFICATION.md` | Komponen UI reusable |
| `08-RESPONSIVE-ACCESSIBILITY.md` | Responsive dan accessibility |
| `09-ROLE-ACCESS-CONTROL.md` | Role, permission, store scope |
| `10-CAMERA-CONNECTIVITY.md` | Jenis koneksi dan flow konfigurasi kamera |
| `11-STREAMING-ARCHITECTURE.md` | Media gateway dan browser playback |
| `12-MAP-SPECIFICATION.md` | MapLibre, marker, cluster, pitch 2.5D |
| `13-DATA-MODEL.md` | Entitas dan relasi data |
| `14-ALERTS-HEALTH-MONITORING.md` | Health check dan lifecycle alert |
| `15-SECURITY-PRIVACY.md` | Security, credential, privasi, audit |
| `16-TECHNICAL-ARCHITECTURE.md` | Stack kandidat dan arsitektur sistem |
| `17-ROADMAP.md` | Tahap pengembangan |
| `18-DEPLOYMENT-OPERATIONS.md` | Environment dan operasi |
| `19-DECISIONS-OPEN-QUESTIONS.md` | Keputusan terkunci dan hal yang belum diketahui |
| `20-TESTING-ACCEPTANCE.md` | QA, acceptance criteria, test plan |
| `21-IMPLEMENTATION-BACKLOG.md` | Backlog implementasi bertahap |
| `REFERENCES.md` | Referensi resmi teknologi dan brand |

## Status keputusan

### Sudah disepakati

- Aplikasi adalah **internal web app** untuk CCTV pada banyak store O!Save.
- Halaman utama adalah map-first, dengan marker untuk store, bukan marker untuk setiap kamera.
- Klik marker membuka store popup; dari sana pengguna membuka floating Camera Explorer; memilih kamera membuka Camera Focus.
- Map tetap menjadi konteks utama ketika panel kamera dibuka.
- Map menggunakan tampilan 2D sebagai default dan perspektif semi-3D yang halus dengan pitch target maksimum sekitar 15–20°.
- Style menggunakan **modern light neumorphism**, dengan referensi komponen shadcn/ui dan Aceternity UI secara selektif.
- Identitas visual menggunakan warna O!Save; palet merah/putih pada dokumen ini masih token draft dan wajib divalidasi dengan aset brand resmi.
- Master Admin, GM, SV, dan Staff adalah role awal.
- GM dapat melihat seluruh store; SV hanya store yang ditugaskan; Staff ditahan dalam akses terbatas sampai Master Admin memberi permission; Master Admin memiliki kontrol penuh.
- Kamera offline harus menghasilkan status dan alert yang jelas.
- Sistem harus menampung beberapa metode koneksi kamera, dengan konfigurasi yang mudah dipahami tim.

### Belum dipastikan

- Jumlah store, kamera per store, model perangkat, vendor, firmware, topologi jaringan, serta bandwidth.
- Apakah setiap store dapat dijangkau melalui private network/VPN atau membutuhkan edge gateway.
- Hak GM/SV untuk acknowledge atau menyelesaikan alert.
- Kebutuhan recording/playback rekaman (tidak termasuk MVP).
- Penyedia vector tiles dan lisensi/biaya map.
- Server, kapasitas concurrent viewer, dan target latency.
- Nilai warna resmi dan file logo resmi O!Save.

**Jangan mengarang jawaban atas hal yang belum dipastikan.** Gunakan asumsi yang ditandai dan buat keputusan teknis yang mudah diubah.
