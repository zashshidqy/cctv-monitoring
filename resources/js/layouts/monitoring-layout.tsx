import React from 'react';
import { AppHeader } from '@/components/app/app-header';

interface MonitoringLayoutProps {
    children: React.ReactNode;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    showSearch?: boolean;
}

/**
 * MonitoringLayout — Layout for the map-first monitoring workspace.
 * Minimal chrome: thin AppHeader on top, children fill remaining viewport height.
 */
export const MonitoringLayout: React.FC<MonitoringLayoutProps> = ({
    children,
    searchQuery,
    onSearchChange,
    showSearch = true,
}) => {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F4F5F6]">
            <AppHeader
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                showSearch={showSearch}
            />
            <main className="flex-1 relative overflow-hidden">
                {children}
            </main>
        </div>
    );
};
