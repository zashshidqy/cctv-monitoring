# 02 — Information Architecture

## 1. Sitemap

```text
O!Save Monitor
├── Authentication
│   ├── Login
│   ├── Forgot Password (jika kebijakan mengizinkan)
│   └── Profile / Session
│
├── Monitoring (semua role dengan permission yang sesuai)
│   ├── Store Map
│   ├── Store Popup (overlay)
│   ├── Camera Explorer (floating panel)
│   ├── Camera Focus (expanded player)
│   └── Alerts / Notification Center
│
└── Administration (Master Admin default)
    ├── Admin Overview
    ├── Stores
    ├── Cameras
    ├── Users
    ├── Roles & Permissions
    ├── Alert Configuration
    ├── Gateway / Connection Nodes
    └── Activity Log
```

## 2. Navigation model

- Monitoring adalah default landing page setelah login bagi user dengan permission monitoring.
- Administration merupakan area terpisah, bukan sidebar yang selalu terlihat pada halaman map.
- Master Admin dapat berpindah antara Monitoring dan Administration.
- Role lain hanya melihat navigasi yang diizinkan.
- Jangan menyamakan `hide menu` dengan access control. Backend tetap memeriksa permission.

## 3. Monitoring layout

- Header tipis: brand, global search, alerts, user menu.
- Main canvas: map mengambil porsi terbesar.
- Map controls mengambang dan tidak menutupi atribusi peta.
- Store popup dan Camera Explorer berada di overlay layer.
- Desktop menggunakan panel kanan; tablet dapat memakai bottom sheet; mobile fokus pada single-camera view.

## 4. Admin navigation

Gunakan sidebar admin yang ringkas dengan kelompok:

- Operations: Stores, Cameras, Gateways.
- Access: Users, Roles & Permissions.
- System: Alert Configuration, Activity Log.

Tampilkan breadcrumb dan page title. Hindari dashboard admin yang penuh KPI tidak relevan.

## 5. URL concept

URL berikut contoh konseptual, bukan kontrak final:

- `/login`
- `/monitoring`
- `/monitoring/stores/{store}`
- `/monitoring/cameras/{camera}`
- `/monitoring/alerts`
- `/admin`
- `/admin/stores`
- `/admin/cameras`
- `/admin/users`
- `/admin/roles-permissions`
- `/admin/gateways`
- `/admin/alerts`
- `/admin/activity-logs`

Overlay state boleh direpresentasikan di URL/query string bila membantu deep-link dan browser back. Pastikan URL tidak membocorkan credential atau stream token.
