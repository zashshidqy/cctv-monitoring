import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { BrandMark } from '@/components/app/brand-mark';
import {
    LayoutDashboard,
    Store,
    Camera,
    Users,
    KeyRound,
    Network,
    FileText,
    ArrowLeft,
    LogOut,
} from 'lucide-react';
import type { SharedProps } from '@/types';

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
}

/**
 * AdminLayout — Clean sidebar layout for Master Admin management screens.
 * Uses modern light neumorphic styling without excessive cards.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
    const { auth } = usePage<SharedProps>().props;
    const currentUrl = window.location.pathname;

    const navGroups: { group: string; items: NavItem[] }[] = [
        {
            group: 'Operasional',
            items: [
                {
                    label: 'Overview',
                    href: '/admin',
                    icon: LayoutDashboard,
                    active: currentUrl === '/admin',
                },
                {
                    label: 'Store',
                    href: '/admin/stores',
                    icon: Store,
                    active: currentUrl.startsWith('/admin/stores'),
                },
                {
                    label: 'Kamera',
                    href: '/admin/cameras',
                    icon: Camera,
                    active: currentUrl.startsWith('/admin/cameras'),
                },
                {
                    label: 'Gateway',
                    href: '/admin/gateways',
                    icon: Network,
                    active: currentUrl.startsWith('/admin/gateways'),
                },
            ],
        },
        {
            group: 'Akses & Pengguna',
            items: [
                {
                    label: 'Pengguna',
                    href: '/admin/users',
                    icon: Users,
                    active: currentUrl.startsWith('/admin/users'),
                },
                {
                    label: 'Peran & Izin',
                    href: '/admin/roles-permissions',
                    icon: KeyRound,
                    active: currentUrl.startsWith('/admin/roles-permissions'),
                },
            ],
        },
        {
            group: 'Sistem',
            items: [
                {
                    label: 'Audit Log',
                    href: '/admin/activity-logs',
                    icon: FileText,
                    active: currentUrl.startsWith('/admin/activity-logs'),
                },
            ],
        },
    ];

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#F4F5F6]">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-[#E0E4E8] flex flex-col shrink-0">
                {/* Brand header */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-[#E0E4E8]">
                    <BrandMark size="sm" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FCE8EA] text-[#E60012]">
                        Admin
                    </span>
                </div>

                {/* Back to monitoring */}
                <div className="p-3 border-b border-[#E0E4E8]">
                    <Link
                        href="/monitoring"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] rounded-[var(--radius-control)] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Monitoring Map</span>
                    </Link>
                </div>

                {/* Navigation items */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-6">
                    {navGroups.map((group) => (
                        <div key={group.group}>
                            <p className="px-3 text-[11px] font-semibold text-[#68727D] uppercase tracking-wider mb-1">
                                {group.group}
                            </p>
                            <ul className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`
                                                    flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-control)] text-xs font-medium transition-colors
                                                    ${item.active
                                                        ? 'bg-[#FCE8EA] text-[#E60012] font-semibold'
                                                        : 'text-[#252A30] hover:bg-[#EEF0F2]'
                                                    }
                                                `}
                                            >
                                                <Icon className={`w-4 h-4 ${item.active ? 'text-[#E60012]' : 'text-[#68727D]'}`} />
                                                <span>{item.label}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div className="p-3 border-t border-[#E0E4E8] flex items-center justify-between">
                    <div className="truncate pr-2">
                        <p className="text-xs font-medium text-[#252A30] truncate">{auth.user?.name}</p>
                        <p className="text-[10px] text-[#68727D] truncate">{auth.user?.email}</p>
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        type="button"
                        aria-label="Keluar"
                        className="p-1.5 rounded-[var(--radius-control)] text-[#68727D] hover:text-[#C62828] hover:bg-[#fee2e2]/50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </Link>
                </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-14 bg-white border-b border-[#E0E4E8] px-6 flex items-center justify-between shrink-0">
                    <h1 className="text-base font-semibold text-[#252A30]">{title}</h1>
                </header>

                {/* Page body */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};
