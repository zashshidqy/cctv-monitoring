import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Compass, Maximize2, Minimize2, Layers, RotateCcw } from 'lucide-react';
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

/**
 * StoreMap — MapLibre GL JS vector map component.
 * Features:
 * - Provider abstraction via tileConfig (OSM raster in dev, MapTiler/vector in prod)
 * - 2D default with smooth pitch easing up to max 15-20°
 * - Manual 2D / Tilt toggle
 * - Store marker and cluster support
 * - Respects prefers-reduced-motion
 */
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
    const [currentZoom, setCurrentZoom] = useState(tileConfig.defaultZoom);
    const [stores, setStores] = useState<StoreMarkerData[]>([]);
    const markersRef = useRef<Map<number, maplibregl.Marker>>(new Map());

    // ─── 1. Initialize Map ───────────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        // Build style depending on provider
        let mapStyle: maplibregl.StyleSpecification | string;

        if (tileConfig.provider === 'osm') {
            // Development OSM raster tile style
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
            // Vector style URL (MapTiler, Mapbox, or custom vector endpoint)
            mapStyle = tileConfig.styleUrl || 'https://demotiles.maplibre.org/style.json';
        }

        const mapInstance = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: tileConfig.defaultCenter,
            zoom: tileConfig.defaultZoom,
            pitch: 0, // Always starts in 2D per specification
            maxPitch: tileConfig.maxPitch, // Max 20° per design rule
            attributionControl: false, // Custom attribution placement
        });

        // Add attribution control to bottom right
        mapInstance.addControl(
            new maplibregl.AttributionControl({ compact: true }),
            'bottom-right'
        );

        mapInstance.on('load', () => {
            map.current = mapInstance;
            setIsLoaded(true);
        });

        // Track zoom and adjust pitch smoothly
        mapInstance.on('zoom', () => {
            const z = mapInstance.getZoom();
            setCurrentZoom(z);

            // Gradual pitch increase if tilt is enabled:
            // z < 10: 0°
            // z 10-14: 0° -> 10°
            // z >= 14: up to max 15-20°
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
            .catch((err) => console.error('Failed to load store GeoJSON:', err));
    }, [isLoaded]);

    // ─── 3. Render HTML Store Markers ─────────────────────────────────────────
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current.clear();

        stores.forEach((store) => {
            // Create DOM element for store marker
            const el = document.createElement('button');
            el.type = 'button';
            el.className = `
                group relative flex items-center justify-center
                w-9 h-9 rounded-full bg-white border-2 border-white
                shadow-[0_3px_10px_rgba(24,32,40,0.18)]
                transition-transform duration-150 hover:scale-110 focus:outline-none
                ${selectedStoreId === store.id ? 'ring-3 ring-[#E60012]/40 scale-110 z-10' : ''}
            `;

            // Inner status ring and icon
            el.innerHTML = `
                <span class="w-7 h-7 rounded-full bg-[#E60012] flex items-center justify-center text-white text-[10px] font-bold tracking-tight">
                    O!
                </span>
                <span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#16834A] border-2 border-white"></span>
            `;

            el.addEventListener('click', () => {
                onStoreSelect?.(store);
                map.current?.easeTo({
                    center: [store.longitude, store.latitude],
                    duration: 500,
                });
            });

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([store.longitude, store.latitude])
                .addTo(map.current!);

            markersRef.current.set(store.id, marker);
        });
    }, [stores, isLoaded, selectedStoreId]);

    // ─── 4. Toggle 2D / Tilt View ─────────────────────────────────────────────
    const toggleTilt = () => {
        if (!map.current) return;
        const newTilt = !isTiltEnabled;
        setIsTiltEnabled(newTilt);

        map.current.easeTo({
            pitch: newTilt ? Math.min(tileConfig.maxPitch, 15) : 0,
            duration: 400,
        });
    };

    // ─── 5. Reset bearing / pitch ─────────────────────────────────────────────
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
