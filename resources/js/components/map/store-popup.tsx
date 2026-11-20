import React from 'react';
import { X, ChevronRight, Video, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import type { StoreMarkerData } from '@/types';

interface StorePopupProps {
    store: StoreMarkerData;
    onClose: () => void;
    onExploreCameras: (store: StoreMarkerData) => void;
}

/**
 * StorePopup — Floating card that appears when a store marker is selected.
 * Follows Modern Light Neumorphism style (surface-raised shadow, clean borders).
 * Never acts as the sole access point to cameras.
 */
export const StorePopup: React.FC<StorePopupProps> = ({
    store,
    onClose,
    onExploreCameras,
}) => {
    return (
        <div className="absolute top-4 left-4 z-20 w-80 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] p-4 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-medium text-[#68727D] uppercase">
                            {store.code}
                        </span>
                        <StatusBadge status={store.markerStatus} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#252A30] leading-snug">
                        {store.name}
                    </h3>
                    {store.city && (
                        <p className="text-[11px] text-[#68727D] mt-0.5 truncate max-w-[200px]" title={`${store.city}${store.address ? ' — ' + store.address : ''}`}>
                            {store.city} {store.address ? `• ${store.address}` : ''}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup info store"
                    className="p-1 rounded-md text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Camera Status Grid */}
            <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#EEF0F2] rounded-[var(--radius-control)] mb-4 text-center">
                <div>
                    <p className="text-[10px] text-[#68727D]">Total</p>
                    <p className="text-sm font-semibold text-[#252A30] tabular-nums">
                        {store.cameraTotal}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-[#16834A]">Online</p>
                    <p className="text-sm font-semibold text-[#16834A] tabular-nums">
                        {store.cameraOnline}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-[#B7791F]">Unstable</p>
                    <p className="text-sm font-semibold text-[#B7791F] tabular-nums">
                        {store.cameraUnstable}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-[#C62828]">Offline</p>
                    <p className="text-sm font-semibold text-[#C62828] tabular-nums">
                        {store.cameraOffline}
                    </p>
                </div>
            </div>

            {/* Primary Action: Explore Cameras */}
            <Button
                variant="default"
                size="sm"
                className="w-full justify-between gap-2"
                onClick={() => onExploreCameras(store)}
            >
                <span className="inline-flex items-center gap-1.5">
                    <Video className="w-4 h-4" />
                    <span>Jelajahi Kamera</span>
                </span>
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    );
};
