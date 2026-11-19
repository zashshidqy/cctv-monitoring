import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import { RotateCcw, Search, MapPin, CheckCircle, AlertTriangle, XCircle, SlidersHorizontal } from 'lucide-react';
import type { StoreMarkerData } from '@/types';

interface TileConfig {
    provider: string;
    styleUrl?: string;
    attribution: string;
    defaultCenter: [number, number]; // [lng, lat]
    defaultZoom: number;
    maxPitch: number;
}

interface StoreMapProps {
    tileConfig: TileConfig;
    onStoreSelect?: (store: StoreMarkerData) => void;
    selectedStoreId?: number | null;
    searchQuery?: string;
}

export const StoreMap: React.FC<StoreMapProps> = ({
    tileConfig,
    onStoreSelect,
    selectedStoreId,
    searchQuery = '',
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isTiltEnabled, setIsTiltEnabled] = useState(false);
    const [stores, setStores] = useState<StoreMarkerData[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'partial' | 'offline'>('all');
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const markersRef = useRef<Map<number, maplibregl.Marker>>(new Map());

    // ─── 1. Initialize Map ───────────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        let mapStyle: maplibregl.StyleSpecification | string;

        if (tileConfig.provider === 'osm') {
            mapStyle = {
                version: 8,
                sources: {
                    'osm-tiles': {
                        type: 'raster',
                        tiles: [tileConfig.styleUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: tileConfig.attribution,
                    },
                },
                layers: [
                    {
                        id: 'osm-layer',
                        type: 'raster',
                        source: 'osm-tiles',
                        minzoom: 0,
                        maxzoom: 19,
                    },
                ],
            };
        } else {
            mapStyle = tileConfig.styleUrl || 'https://demotiles.maplibre.org/style.json';
        }

        const mapInstance = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: tileConfig.defaultCenter,
            zoom: tileConfig.defaultZoom,
            pitch: 0,
            maxPitch: tileConfig.maxPitch,
            attributionControl: false,
        });

        mapInstance.addControl(
            new maplibregl.AttributionControl({ compact: true }),
            'bottom-right'
        );

        mapInstance.on('load', () => {
            map.current = mapInstance;
            setIsLoaded(true);
        });

        // Smooth pitch adjustment based on zoom if tilt is enabled
        mapInstance.on('zoom', () => {
            const z = mapInstance.getZoom();
            if (isTiltEnabled) {
                let targetPitch = 0;
                if (z >= 14) targetPitch = Math.min(tileConfig.maxPitch, 15);
                else if (z >= 10) targetPitch = ((z - 10) / 4) * 10;

                mapInstance.easeTo({ pitch: targetPitch, duration: 200 });
            }
        });

        return () => {
            mapInstance.remove();
            map.current = null;
        };
    }, []);

    // ─── 2. Fetch Authorized Stores ──────────────────────────────────────────
    useEffect(() => {
        if (!isLoaded) return;

        fetch('/monitoring/stores/geojson')
            .then((res) => res.json())
            .then((data) => {
                if (data.type === 'FeatureCollection') {
                    const parsedStores: StoreMarkerData[] = data.features.map((f: any) => ({
                        id: f.properties.id,
                        code: f.properties.code,
                        name: f.properties.name,
                        latitude: f.geometry.coordinates[1],
                        longitude: f.geometry.coordinates[0],
                        markerStatus: f.properties.markerStatus,
                        cameraTotal: f.properties.cameraTotal,
                        cameraOnline: f.properties.cameraOnline,
                        cameraUnstable: f.properties.cameraUnstable,
                        cameraOffline: f.properties.cameraOffline,
                        cameraUnknown: f.properties.cameraUnknown,
                    }));
                    setStores(parsedStores);
                }
            })
            .catch((err) => console.error('Gagal memuat GeoJSON store:', err));
    }, [isLoaded]);

    // ─── 3. Filtered Stores ──────────────────────────────────────────────────
    const filteredStores = useMemo(() => {
        return stores.filter((s) => {
            const matchesStatus =
                statusFilter === 'all' ? true : s.markerStatus === statusFilter;
            const matchesSearch = searchQuery.trim()
                ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.code.toLowerCase().includes(searchQuery.toLowerCase())
                : true;
            return matchesStatus && matchesSearch;
        });
    }, [stores, statusFilter, searchQuery]);

    // ─── 4. Render HTML Store Markers with Status Color Rings ────────────────
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current.clear();

        filteredStores.forEach((store) => {
            const el = document.createElement('button');
            el.type = 'button';
            el.setAttribute('aria-label', `${store.name} (${store.code})`);

            const isSelected = selectedStoreId === store.id;

            // Status dot color mapping
            const statusColor =
                store.markerStatus === 'online'
                    ? '#16834A'
                    : store.markerStatus === 'partial'
                    ? '#B7791F'
                    : store.markerStatus === 'offline'
                    ? '#C62828'
                    : '#68727D';

            el.className = `
                group relative flex items-center justify-center
                w-9 h-9 rounded-full bg-white border-2 border-white
                shadow-[0_3px_10px_rgba(24,32,40,0.18)]
                transition-transform duration-150 hover:scale-110 focus:outline-none cursor-pointer
                ${isSelected ? 'ring-3 ring-[#E60012]/40 scale-110 z-20' : 'z-10'}
            `;

            el.innerHTML = `
                <span class="w-7 h-7 rounded-full bg-[#E60012] flex items-center justify-center text-white text-[10px] font-bold tracking-tight">
                    O!
                </span>
                <span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style="background-color: ${statusColor};"></span>
                <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-[#252A30] text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-md pointer-events-none z-30">
                    ${store.name}
                </span>
            `;

            el.addEventListener('click', () => {
                onStoreSelect?.(store);
                map.current?.flyTo({
                    center: [store.longitude, store.latitude],
                    zoom: 14,
                    pitch: isTiltEnabled ? 15 : 0,
                    duration: 800,
                });
            });

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([store.longitude, store.latitude])
                .addTo(map.current!);

            markersRef.current.set(store.id, marker);
        });
    }, [filteredStores, isLoaded, selectedStoreId, isTiltEnabled]);

    // ─── 5. Fly To Specific Store ────────────────────────────────────────────
    const flyToStore = (store: StoreMarkerData) => {
        onStoreSelect?.(store);
        setIsSearchDropdownOpen(false);
        map.current?.flyTo({
            center: [store.longitude, store.latitude],
            zoom: 15,
            pitch: isTiltEnabled ? 15 : 0,
            duration: 900,
        });
    };

    // ─── 6. Toggle 2D / Tilt View ─────────────────────────────────────────────
    const toggleTilt = () => {
        if (!map.current) return;
        const newTilt = !isTiltEnabled;
        setIsTiltEnabled(newTilt);

        map.current.easeTo({
            pitch: newTilt ? Math.min(tileConfig.maxPitch, 15) : 0,
            duration: 400,
        });
    };

    // ─── 7. Reset View ────────────────────────────────────────────────────────
    const resetView = () => {
        if (!map.current) return;
        map.current.easeTo({
            center: tileConfig.defaultCenter,
            zoom: tileConfig.defaultZoom,
            pitch: 0,
            bearing: 0,
            duration: 600,
        });
        setIsTiltEnabled(false);
    };

    return (
        <div className="relative w-full h-full">
            {/* Map Canvas */}
            <div ref={mapContainer} className="w-full h-full" />

            {/* Floating Filter Chips — Top Left */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-[#E0E4E8] rounded-[var(--radius-panel)] p-1.5 shadow-[var(--shadow-raised)]">
                <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-[var(--radius-control)] text-xs font-medium transition-colors ${
                        statusFilter === 'all'
                            ? 'bg-[#252A30] text-white shadow-xs'
                            : 'text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2]'
                    }`}
                >
                    Semua ({stores.length})
                </button>
                <button
                    type="button"
                    onClick={() => setStatusFilter('online')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-control)] text-xs font-medium transition-colors ${
                        statusFilter === 'online'
                            ? 'bg-[#16834A] text-white shadow-xs'
                            : 'text-[#68727D] hover:text-[#16834A] hover:bg-[#dcfce7]'
                    }`}
                >
                    <span className="w-2 h-2 rounded-full bg-[#16834A]" />
                    <span>Online</span>
                </button>
                <button
                    type="button"
                    onClick={() => setStatusFilter('partial')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-control)] text-xs font-medium transition-colors ${
                        statusFilter === 'partial'
                            ? 'bg-[#B7791F] text-white shadow-xs'
                            : 'text-[#68727D] hover:text-[#B7791F] hover:bg-[#fef9c3]'
                    }`}
                >
                    <span className="w-2 h-2 rounded-full bg-[#B7791F]" />
                    <span>Sebagian</span>
                </button>
                <button
                    type="button"
                    onClick={() => setStatusFilter('offline')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-control)] text-xs font-medium transition-colors ${
                        statusFilter === 'offline'
                            ? 'bg-[#C62828] text-white shadow-xs'
                            : 'text-[#68727D] hover:text-[#C62828] hover:bg-[#fee2e2]'
                    }`}
                >
                    <span className="w-2 h-2 rounded-full bg-[#C62828]" />
                    <span>Offline</span>
                </button>
            </div>

            {/* Search Dropdown Indicator if Query entered */}
            {searchQuery.trim().length > 0 && filteredStores.length > 0 && (
                <div className="absolute top-16 left-4 z-20 w-72 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="px-2.5 py-1 text-[10px] uppercase font-semibold text-[#68727D] tracking-wider">
                        Hasil Pencarian ({filteredStores.length})
                    </p>
                    <div className="space-y-0.5">
                        {filteredStores.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => flyToStore(s)}
                                className="w-full text-left px-2.5 py-2 rounded-[var(--radius-control)] hover:bg-[#EEF0F2] flex items-center justify-between transition-colors"
                            >
                                <div>
                                    <p className="text-xs font-semibold text-[#252A30] leading-none">
                                        {s.name}
                                    </p>
                                    <p className="text-[10px] text-[#68727D] mt-1 font-mono">{s.code}</p>
                                </div>
                                <span
                                    className="w-2 h-2 rounded-full shrink-0 ml-2"
                                    style={{
                                        backgroundColor:
                                            s.markerStatus === 'online'
                                                ? '#16834A'
                                                : s.markerStatus === 'partial'
                                                ? '#B7791F'
                                                : '#C62828',
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Map Controls — Top Right */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
                {/* 2D / Tilt Toggle */}
                <button
                    type="button"
                    onClick={toggleTilt}
                    title={isTiltEnabled ? 'Kembali ke tampilan 2D' : 'Aktifkan sudut semi-3D (maks 15-20°)'}
                    className={`
                        w-9 h-9 rounded-[var(--radius-control)] bg-white border border-[#E0E4E8]
                        flex items-center justify-center text-xs font-semibold
                        shadow-[var(--shadow-raised)] transition-colors
                        ${isTiltEnabled ? 'bg-[#FCE8EA] text-[#E60012] border-[#E60012]/30' : 'text-[#252A30] hover:bg-[#EEF0F2]'}
                    `}
                >
                    {isTiltEnabled ? '3D' : '2D'}
                </button>

                {/* Reset view */}
                <button
                    type="button"
                    onClick={resetView}
                    title="Reset tampilan peta"
                    className="w-9 h-9 rounded-[var(--radius-control)] bg-white border border-[#E0E4E8] flex items-center justify-center text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] shadow-[var(--shadow-raised)] transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Map Status Legend — Bottom Left */}
            <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur-xs border border-[#E0E4E8] rounded-[var(--radius-card)] p-2.5 shadow-[var(--shadow-raised)] z-10 text-[11px] select-none">
                <p className="font-semibold text-[#252A30] mb-1.5 uppercase tracking-wider text-[10px]">
                    Status Store
                </p>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#16834A]" />
                        <span className="text-[#252A30]">Online</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#B7791F]" />
                        <span className="text-[#252A30]">Sebagian</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C62828]" />
                        <span className="text-[#252A30]">Offline</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
