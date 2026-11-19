import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { Store, Camera, Users, ShieldCheck, Activity, ArrowUpRight } from 'lucide-react';

/**
 * Admin Overview — Master Admin dashboard.
 * Operational and action-oriented. No decorative generic KPI charts.
 */
export default function AdminOverview() {
    const stats = [
        { label: 'Total Store Aktif', value: '4', note: 'Semua terdaftar (DEMO)', icon: Store, href: '/admin/stores' },
        { label: 'Total Kamera Terpantau', value: '24', note: 'Status Online (DEMO)', icon: Camera, href: '/admin/cameras' },
        { label: 'Pengguna Sistem', value: '4', note: 'Master Admin, GM, SV, Staff', icon: Users, href: '/admin/users' },
        { label: 'Insiden / Alert Aktif', value: '0', note: 'Kondisi stabil', icon: Activity, href: '/admin/alerts' },
    ];

    return (
        <AdminLayout title="Admin Overview">
            <Head title="Admin Overview — O!Save Monitor" />

            <div className="space-y-6 max-w-6xl">
                {/* Notice banner */}
                <div className="p-4 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised)] flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-4 h-4 text-[#E60012]" />
                            <h2 className="text-xs font-semibold text-[#252A30] uppercase tracking-wider">
                                Epic 1 — Project Foundation
                            </h2>
                        </div>
                        <p className="text-xs text-[#68727D] leading-relaxed">
                            Fondasi autentikasi, layout global, design tokens modern light neumorphism, RBAC role-scope, dan MapLibre telah terpasang. Modul CRUD administrasi penuh akan dilanjutkan pada Epic 7.
                        </p>
                    </div>

                    <Link
                        href="/monitoring"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#E60012] hover:bg-[#C90016] rounded-[var(--radius-control)] transition-colors shrink-0"
                    >
                        <span>Buka Monitoring Map</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* Operational summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-4 shadow-[var(--shadow-raised)] flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-[#68727D]">{stat.label}</span>
                                    <div className="w-8 h-8 rounded-lg bg-[#EEF0F2] flex items-center justify-center text-[#68727D]">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-2xl font-bold text-[#252A30] tracking-tight tabular-nums">
                                        {stat.value}
                                    </p>
                                    <p className="text-[11px] text-[#68727D] mt-1">{stat.note}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* RBAC Scope Summary Table */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-5 shadow-[var(--shadow-raised)]">
                    <h3 className="text-sm font-semibold text-[#252A30] mb-3">
                        Status Peran & Scope Akses (RBAC Model)
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#EEF0F2] text-[#68727D] uppercase text-[10px]">
                                <tr>
                                    <th className="p-2.5 rounded-l-[var(--radius-control)]">Role</th>
                                    <th className="p-2.5">Scope Store</th>
                                    <th className="p-2.5">Akses Monitoring</th>
                                    <th className="p-2.5">Akses Administrasi</th>
                                    <th className="p-2.5 rounded-r-[var(--radius-control)]">Default Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0E4E8] text-[#252A30]">
                                <tr>
                                    <td className="p-2.5 font-medium">Master Admin</td>
                                    <td className="p-2.5 text-[#16834A]">Semua Store (Global)</td>
                                    <td className="p-2.5">Full View + Stream</td>
                                    <td className="p-2.5 text-[#16834A]">Full Mutation</td>
                                    <td className="p-2.5">Semua izin aktif</td>
                                </tr>
                                <tr>
                                    <td className="p-2.5 font-medium">General Manager (GM)</td>
                                    <td className="p-2.5 text-[#16834A]">Semua Store (Global)</td>
                                    <td className="p-2.5">Full View + Stream</td>
                                    <td className="p-2.5 text-[#68727D]">Read Only</td>
                                    <td className="p-2.5">Global view-only</td>
                                </tr>
                                <tr>
                                    <td className="p-2.5 font-medium">Supervisor (SV)</td>
                                    <td className="p-2.5 text-[#B7791F]">Store yang Ditugaskan</td>
                                    <td className="p-2.5">View + Stream (Scoped)</td>
                                    <td className="p-2.5 text-[#68727D]">Tidak Ada</td>
                                    <td className="p-2.5">Assigned scope only</td>
                                </tr>
                                <tr>
                                    <td className="p-2.5 font-medium">Staff</td>
                                    <td className="p-2.5 text-[#C62828]">Dikonfigurasi Admin</td>
                                    <td className="p-2.5 text-[#C62828]">Nol (Default)</td>
                                    <td className="p-2.5 text-[#C62828]">Tidak Ada</td>
                                    <td className="p-2.5 text-[#C62828] font-medium">Default Deny (Empty)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
