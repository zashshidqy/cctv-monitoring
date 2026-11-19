import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { MonitoringLayout } from '@/layouts/monitoring-layout';
import { StoreMap } from '@/components/map/store-map';
import { StorePopup } from '@/components/map/store-popup';
import { X, Video, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import type { StoreMarkerData } from '@/types';

interface TileConfig {
    provider: string;
    styleUrl?: string;
    attribution: string;
    defaultCenter: [number, number];
    defaultZoom: number;
    maxPitch: number;
}

interface MonitoringIndexProps {
    tileConfig: TileConfig;
}

/**
 * Monitoring Workspace — Map-first landing page.
 * Implements: Login → Monitoring Map → Select Store Marker → Store Popup → Camera Explorer
 * Map remains the persistent background context.
 */
export default function MonitoringIndex({ tileConfig }: MonitoringIndexProps) {
    const [selectedStore, setSelectedStore] = useState<StoreMarkerData | null>(null);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleStoreSelect = (store: StoreMarkerData) => {
        setSelectedStore(store);
        // Do not auto-open explorer; user opens via popup action
    };

    const handleExploreCameras = (store: StoreMarkerData) => {
        setSelectedStore(store);
        setIsExplorerOpen(true);
    };

    return (
        <MonitoringLayout
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showSearch={true}
        >
            <Head title="Monitoring — O!Save Monitor" />

            {/* Map Canvas fills entire viewport */}
            <StoreMap
                tileConfig={tileConfig}
                onStoreSelect={handleStoreSelect}
                selectedStoreId={selectedStore?.id}
                searchQuery={searchQuery}
            />

            {/* Store Popup (when marker clicked, explorer not yet open) */}
            {selectedStore && !isExplorerOpen && (
                <StorePopup
                    store={selectedStore}
                    onClose={() => setSelectedStore(null)}
                    onExploreCameras={handleExploreCameras}
                />
            )}

            {/* Camera Explorer Drawer (Right side floating panel) — Epic 1 Preparation */}
            {selectedStore && isExplorerOpen && (
                <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#E0E4E8] shadow-[var(--shadow-raised-lg)] z-20 flex flex-col animate-in slide-in-from-right duration-200">
                    {/* Explorer Header */}
                    <div className="p-4 border-b border-[#E0E4E8] flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-mono font-medium text-[#68727D] uppercase">
                                    {selectedStore.code}
                                </span>
                                <StatusBadge status={selectedStore.markerStatus} />
                            </div>
                            <h2 className="text-sm font-semibold text-[#252A30]">
                                {selectedStore.name}
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsExplorerOpen(false)}
                            aria-label="Tutup panel explorer"
                            className="p-1.5 rounded-md text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Explorer Body — Epic 1 Foundation view */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="p-3 bg-[#EEF0F2] rounded-[var(--radius-card)] text-xs text-[#68727D]">
                            <p className="font-semibold text-[#252A30] mb-1">
                                Foundation Mode (Epic 1)
                            </p>
                            <p>
                                Panel Camera Explorer dan Dynamic Mosaic akan diaktifkan secara penuh pada <span className="font-medium text-[#252A30]">Epic 4 & 5</span> setelah verifikasi konektivitas gateway MediaMTX (Epic 0 PoC).
                            </p>
                        </div>

                        {/* Camera stub cards */}
                        <div>
                            <p className="text-xs font-semibold text-[#252A30] mb-2">
                                Daftar Kamera Store ({selectedStore.cameraTotal})
                            </p>

                            <div className="space-y-2">
                                {[
                                    { name: 'Kamera 01 — Kasir Utama', area: 'Kasir', status: 'online' },
                                    { name: 'Kamera 02 — Area Masuk', area: 'Entrance', status: 'online' },
                                    { name: 'Kamera 03 — Lorong Belakang', area: 'Aisle', status: 'online' },
                                    { name: 'Kamera 04 — Loading Dock', area: 'Gudang', status: 'online' },
                                ].map((cam, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-white border border-[#E0E4E8] rounded-[var(--radius-card)] shadow-xs flex items-center justify-between hover:border-[#E60012]/40 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-[#EEF0F2] flex items-center justify-center text-[#68727D]">
                                                <Video className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[#252A30]">{cam.name}</p>
                                                <p className="text-[10px] text-[#68727D]">{cam.area}</p>
                                            </div>
                                        </div>

                                        <StatusBadge status={cam.status as any} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Explorer Footer */}
                    <div className="p-3 border-t border-[#E0E4E8] bg-[#F4F5F6] flex justify-between items-center text-[11px] text-[#68727D]">
                        <span>Stream aktif: 0 (camera-on-demand)</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExplorerOpen(false)}
                        >
                            Tutup
                        </Button>
                    </div>
                </div>
            )}
        </MonitoringLayout>
    );
}
