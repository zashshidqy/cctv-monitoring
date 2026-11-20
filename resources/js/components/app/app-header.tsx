import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { BrandMark } from './brand-mark';
import { ShieldCheck, LogOut, Search } from 'lucide-react';
import { AlertBell } from '@/components/alert/alert-bell';
import { ThemeToggle } from './theme-toggle';
import type { SharedProps } from '@/types';

interface AppHeaderProps {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    showSearch?: boolean;
}

/**
 * AppHeader — Compact header for monitoring workspace.
 * Kept low-profile so the map canvas remains dominant.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
    searchQuery = '',
    onSearchChange,
    showSearch = true,
}) => {
    const { auth, unreadAlertCount } = usePage<SharedProps>().props;
    const user = auth.user;

    // Navigate to store on map when alert clicked
    const handleNavigateToStore = (storeId: number) => {
        // Emit custom event for map to handle
        window.dispatchEvent(new CustomEvent('navigate-to-store', { detail: { storeId } }));
    };

    const handleNavigateToAlertsPage = () => {
        window.location.href = '/alerts';
    };

    return (
        <header className="h-14 bg-white/95 backdrop-blur-xs border-b border-[#E0E4E8] px-4 flex items-center justify-between gap-4 z-20 shrink-0">
            {/* Left: Brand + Scope badge */}
            <div className="flex items-center gap-3">
                <Link href="/" className="hover:opacity-90 transition-opacity">
                    <BrandMark size="sm" />
                </Link>

                {/* Role/Scope badge */}
                {user && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#EEF0F2] text-[#68727D]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16834A]" />
                        {user.role === 'master_admin' && 'Master Admin'}
                        {user.role === 'gm' && 'GM • Semua Store'}
                        {user.role === 'sv' && 'SV • Store Assigned'}
                        {user.role === 'staff' && 'Staff'}
                    </span>
                )}
            </div>

            {/* Center: Global Store Search (compact) */}
            {showSearch && onSearchChange && (
                <div className="flex-1 max-w-md hidden md:block">
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#68727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Cari store, kode, atau kota..."
                            className="w-full h-8 pl-9 pr-3 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] placeholder:text-[#68727D] focus:outline-none focus:ring-2 focus:ring-[#E60012]/20 focus:border-[#E60012] transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Right: Actions & User menu */}
            <div className="flex items-center gap-2">
                {/* Admin panel link (Master Admin only) */}
                {user?.role === 'master_admin' && (
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[var(--radius-control)] border border-[#E0E4E8] bg-white text-[#252A30] hover:bg-[#EEF0F2] transition-colors"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#E60012]" />
                        <span className="hidden sm:inline">Admin</span>
                    </Link>
                )}

                {/* Alert Bell Component */}
                {user && (
                    <AlertBell
                        userRole={user.role as 'master_admin' | 'gm' | 'sv' | 'staff'}
                        onNavigateToStore={handleNavigateToStore}
                        onNavigateToAlertsPage={handleNavigateToAlertsPage}
                    />
                )}

                {/* Theme Toggle */}
                {user && (
                    <ThemeToggle />
                )}

                {/* User Info & Logout */}
                {user && (
                    <div className="flex items-center gap-2 pl-2 border-l border-[#E0E4E8]">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-medium text-[#252A30] leading-none">{user.name}</p>
                            <p className="text-[10px] text-[#68727D] leading-none mt-0.5">{user.email}</p>
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
                )}
            </div>
        </header>
    );
};
