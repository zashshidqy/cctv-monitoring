import React, { useState, useEffect, Suspense } from 'react';
import { Head } from '@inertiajs/react';
import { MonitoringLayout } from '@/layouts/monitoring-layout';
import { StoreMap } from '@/components/map/store-map';
import { StorePopup } from '@/components/map/store-popup';
import { CameraExplorer } from '@/components/camera/camera-explorer';
import { X, Video, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { AlertBell } from '@/components/alert/alert-bell';
import { SkeletonDrawer } from '@/components/ui/skeleton';
import type { StoreMarkerData, CameraCardData } from '@/types';

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

interface StoreCamerasResponse {
    store: {
        id: number;
        code: string;
        name: string;
        city: string;
    };
    cameras: CameraCardData[];
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
    const [storeCameras, setStoreCameras] = useState<CameraCardData[]>([]);
    const [camerasLoading, setCamerasLoading] = useState(false);

    const handleStoreSelect = (store: StoreMarkerData) => {
        setSelectedStore(store);
        // Do not auto-open explorer; user opens via popup action
    };

    const handleExploreCameras = (store: StoreMarkerData) => {
        setSelectedStore(store);
        setIsExplorerOpen(true);
    };

    // Fetch cameras when explorer opens or store changes
    useEffect(() => {
        if (!selectedStore || !isExplorerOpen) {
            setStoreCameras([]);
            return;
        }

        let cancelled = false;
        setCamerasLoading(true);

        fetch(`/monitoring/stores/${selectedStore.id}/cameras`)
            .then((res) => {
                if (!res.ok) throw new Error('Gagal memuat daftar kamera');
                return res.json() as Promise<StoreCamerasResponse>;
            })
            .then((data) => {
                if (!cancelled) {
                    setStoreCameras(data.cameras);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Failed to load cameras:', err);
                    setStoreCameras([]);
                }
            })
            .finally(() => {
                if (!cancelled) setCamerasLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedStore, isExplorerOpen]);

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

            {/* Camera Explorer Drawer (Right side floating panel) — Epic 1 & 3 Connected */}
            {selectedStore && isExplorerOpen && (
                <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1E2329] border-l border-[#E0E4E8] dark:border-[#2D3748] shadow-[var(--shadow-raised-lg)] z-20 flex flex-col animate-in slide-in-from-right duration-200" role="dialog" aria-label="Camera Explorer" aria-modal="true">
                    {/* Explorer Header */}
                    <div className="p-4 border-b border-[#E0E4E8] dark:border-[#2D3748] flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-mono font-medium text-[#68727D] dark:text-[#A0AEC0] uppercase">
                                    {selectedStore.code}
                                </span>
                                <StatusBadge status={selectedStore.markerStatus} />
                            </div>
                            <h2 className="text-sm font-semibold text-[#252A30] dark:text-white truncate max-w-[240px]">
                                {selectedStore.name}
                            </h2>
                            {selectedStore.city && (
                                <p className="text-[10px] text-[#68727D] dark:text-[#A0AEC0] mt-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E60012]" aria-hidden="true" />
                                    {selectedStore.city}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsExplorerOpen(false)}
                            aria-label="Tutup panel explorer"
                            className="p-1.5 rounded-md text-[#68727D] dark:text-[#A0AEC0] hover:text-[#252A30] dark:hover:text-white hover:bg-[#EEF0F2] dark:hover:bg-[#2D3748] transition-colors"
                        >
                            <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Explorer Body — Real Camera Explorer */}
                    <div className="flex-1 overflow-hidden">
                        <Suspense fallback={<SkeletonDrawer />}>
                            <CameraExplorer
                                cameras={storeCameras}
                                isLoading={camerasLoading}
                                onCameraSelect={(camera) => console.log('Camera selected:', camera)}
                            />
                        </Suspense>
                    </div>

                    {/* Explorer Footer */}
                    <div className="p-3 border-t border-[#E0E4E8] dark:border-[#2D3748] bg-[#F4F5F6] dark:bg-[#15191D] flex justify-between items-center text-[11px] text-[#68727D] dark:text-[#A0AEC0]">
                        <span>
                            {storeCameras.length === 0 ? 'Belum ada kamera terdaftar' : `${storeCameras.length} kamera tersedia`}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExplorerOpen(false)}
                            aria-label="Tutup Camera Explorer"
                        >
                            Tutup
                        </Button>
                    </div>
                </div>
            )}
        </MonitoringLayout>
    );
}