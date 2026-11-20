import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { RotateCcw, Search, MapPin, CheckCircle, AlertTriangle, XCircle, SlidersHorizontal, Building2 } from 'lucide-react';
import type { StoreMarkerData } from '@/types';
import { SkeletonMapMarker } from '@/components/ui/skeleton';

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

interface MarkerEntry {
    marker: maplibregl.Marker;
    element: HTMLButtonElement;
    store: StoreMarkerData;
    isVisible: boolean;
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
    const [isSearchingAjax, setIsSearchingAjax] = useState(false);
    const [markersLoaded, setMarkersLoaded] = useState(false);
    const markersRef = useRef<Map<number, MarkerEntry>>(new Map());
    const observerRef = useRef<IntersectionObserver | null>(null);
    const viewportBoundsRef = useRef<maplibregl.LngLatBounds | null>(null);

    // ─── 1. Initialize Map with Zoom Clamping & Safe Error Handling ───────────
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

        const maxPitchAllowed = Math.min(tileConfig.maxPitch || 20, 20);

        const mapInstance = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: tileConfig.defaultCenter,
            zoom: tileConfig.defaultZoom,
            minZoom: 3,
            maxZoom: 18,
            pitch: 0,
            maxPitch: maxPitchAllowed,
            attributionControl: false,
        });

        // Suppress tile load 404s from crashing canvas
        mapInstance.on('error', (e) => {
            if (e?.error?.message?.includes('404')) return;
            console.warn('MapLibre non-fatal notice:', e?.error?.message || e);
        });

        mapInstance.addControl(
            new maplibregl.AttributionControl({ compact: true }),
            'bottom-right'
        );

        // Handle navigate-to-store event from AlertBell (defined here for cleanup access)
        const handleNavigateToStore = (event: CustomEvent) => {
            const { storeId } = event.detail;
            const storeEntry = markersRef.current.get(storeId);
            if (storeEntry && map.current) {
                map.current.flyTo({
                    center: [storeEntry.store.longitude, storeEntry.store.latitude],
                    zoom: 15,
                    pitch: isTiltEnabled ? 18 : 0,
                    duration: 900,
                });
                // Trigger store selection
                onStoreSelect?.(storeEntry.store);
            }
        };
        window.addEventListener('navigate-to-store', handleNavigateToStore as EventListener);

        mapInstance.on('load', () => {
            map.current = mapInstance;
            setIsLoaded(true);

            // Add 3D Extrusion layer if vector source with buildings is available
            const style = mapInstance.getStyle();
            if (style && style.sources) {
                const vectorSourceKey = Object.keys(style.sources).find(
                    (k) => style.sources[k].type === 'vector'
                );

                if (vectorSourceKey && !mapInstance.getLayer('3d-buildings')) {
                    const layers = style.layers || [];
                    let labelLayerId: string | undefined;
                    for (const layer of layers) {
                        if (layer.type === 'symbol' && layer.layout && (layer.layout as any)['text-field']) {
                            labelLayerId = layer.id;
                            break;
                        }
                    }

                    try {
                        mapInstance.addLayer(
                            {
                                id: '3d-buildings',
                                source: vectorSourceKey,
                                'source-layer': 'building',
                                filter: ['==', 'extrude', 'true'],
                                type: 'fill-extrusion',
                                minzoom: 14,
                                layout: {
                                    visibility: 'none',
                                },
                                paint: {
                                    'fill-extrusion-color': '#D1D5DB',
                                    'fill-extrusion-height': [
                                        'interpolate',
                                        ['linear'],
                                        ['zoom'],
                                        14,
                                        0,
                                        15.05,
                                        ['get', 'height'],
                                    ],
                                    'fill-extrusion-base': [
                                        'interpolate',
                                        ['linear'],
                                        ['zoom'],
                                        14,
                                        0,
                                        15.05,
                                        ['get', 'min_height'],
                                    ],
                                    'fill-extrusion-opacity': 0.65,
                                },
                            },
                            labelLayerId
                        );
                    } catch {
                        // Optional vector layer enhancement
                    }
                }
            }
        });

        // Smooth pitch adjustment based on zoom level when tilt is enabled
        mapInstance.on('zoom', () => {
            const z = mapInstance.getZoom();
            if (isTiltEnabled) {
                let targetPitch = 0;
                if (z >= 14) targetPitch = Math.min(maxPitchAllowed, 18);
                else if (z >= 10) targetPitch = ((z - 10) / 4) * 12;

                mapInstance.easeTo({ pitch: targetPitch, duration: 150 });
            }
        });

        // Update viewport bounds for lazy marker loading
        mapInstance.on('moveend', () => {
            viewportBoundsRef.current = mapInstance.getBounds();
            checkMarkerVisibility();
        });

        return () => {
            window.removeEventListener('navigate-to-store', handleNavigateToStore as EventListener);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            mapInstance.remove();
            map.current = null;
        };
    }, []);

    // ─── 2. Fetch Initial Authorized Stores (GeoJSON) ─────────────────────────
    useEffect(() => {
        if (!isLoaded) return;

        fetch('/monitoring/stores/geojson')
            .then((res) => res.json())
            .then((data) => {
                if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
                    const parsedStores: StoreMarkerData[] = data.features.map((f: any) => ({
                        id: f.properties.id,
                        code: f.properties.code,
                        name: f.properties.name,
                        city: f.properties.city || '',
                        region: f.properties.region || '',
                        address: f.properties.address || '',
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

    // ─── 3. AJAX Debounced Search (Kota, Nama, Kode, Alamat) ──────────────────
    useEffect(() => {
        if (!isLoaded || !searchQuery.trim()) return;

        setIsSearchingAjax(true);
        const controller = new AbortController();

        const timer = setTimeout(() => {
            fetch(`/monitoring/stores/geojson?search=${encodeURIComponent(searchQuery.trim())}`, {
                signal: controller.signal,
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
                        const fetchedStores: StoreMarkerData[] = data.features.map((f: any) => ({
                            id: f.properties.id,
                            code: f.properties.code,
                            name: f.properties.name,
                            city: f.properties.city || '',
                            region: f.properties.region || '',
                            address: f.properties.address || '',
                            latitude: f.geometry.coordinates[1],
                            longitude: f.geometry.coordinates[0],
                            markerStatus: f.properties.markerStatus,
                            cameraTotal: f.properties.cameraTotal,
                            cameraOnline: f.properties.cameraOnline,
                            cameraUnstable: f.properties.cameraUnstable,
                            cameraOffline: f.properties.cameraOffline,
                            cameraUnknown: f.properties.cameraUnknown,
                        }));

                        setStores((prev) => {
                            const mapById = new Map<number, StoreMarkerData>();
                            prev.forEach((s) => mapById.set(s.id, s));
                            fetchedStores.forEach((s) => mapById.set(s.id, s));
                            return Array.from(mapById.values());
                        });
                    }
                })
                .catch((err) => {
                    if (err.name !== 'AbortError') {
                        console.error('AJAX search error:', err);
                    }
                })
                .finally(() => {
                    setIsSearchingAjax(false);
                });
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
            setIsSearchingAjax(false);
        };
    }, [searchQuery, isLoaded]);

    // ─── 4. Filtered Stores (Multi-field Client Match + Instant Fallback) ─────
    const filteredStores = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return stores.filter((s) => {
            const matchesStatus =
                statusFilter === 'all' ? true : s.markerStatus === statusFilter;

            const matchesSearch = !query ||
                s.name.toLowerCase().includes(query) ||
                s.code.toLowerCase().includes(query) ||
                (s.city && s.city.toLowerCase().includes(query)) ||
                (s.region && s.region.toLowerCase().includes(query)) ||
                (s.address && s.address.toLowerCase().includes(query));

            return matchesStatus && matchesSearch;
        });
    }, [stores, statusFilter, searchQuery]);

    // ─── 5. Lazy Marker Loading with IntersectionObserver ──────────────────────
    const checkMarkerVisibility = useCallback(() => {
        if (!map.current || !viewportBoundsRef.current) return;

        const bounds = viewportBoundsRef.current;
        const zoom = map.current.getZoom();

        // Only lazy-load markers when zoomed out (many markers visible)
        const shouldLazyLoad = zoom < 12;

        filteredStores.forEach((store) => {
            const entry = markersRef.current.get(store.id);
            const lngLat = new maplibregl.LngLat(store.longitude, store.latitude);
            const isInViewport = bounds.contains(lngLat);

            if (entry) {
                // Update visibility state
                if (entry.isVisible !== isInViewport) {
                    entry.isVisible = isInViewport;
                    entry.marker.setLngLat([store.longitude, store.latitude]); // Ensure position is correct
                }
            } else if (isInViewport || !shouldLazyLoad) {
                // Create marker immediately if in viewport or not lazy-loading
                createMarker(store);
            }
        });

        // Clean up markers outside viewport when lazy-loading
        if (shouldLazyLoad) {
            markersRef.current.forEach((entry, id) => {
                if (!entry.isVisible && !filteredStores.some(s => s.id === id)) {
                    entry.marker.remove();
                    markersRef.current.delete(id);
                }
            });
        }

        setMarkersLoaded(true);
    }, [filteredStores]);

    const createMarker = (store: StoreMarkerData) => {
        if (!map.current) return;

        const isSelected = selectedStoreId === store.id;

        const statusColor =
            store.markerStatus === 'online'
                ? '#16834A'
                : store.markerStatus === 'partial'
                ? '#B7791F'
                : store.markerStatus === 'offline'
                ? '#C62828'
                : '#68727D';

        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-label', `${store.name} (${store.code}) — ${store.city}`);
        el.setAttribute('role', 'button');
        el.setAttribute('tabIndex', '0');

        el.className = `
            group relative flex items-center justify-center
            w-9 h-9 rounded-full bg-white border-2 border-white
            shadow-[0_3px_10px_rgba(24,32,40,0.18)]
            transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#E60012]/40 cursor-pointer
            ${isSelected ? 'ring-3 ring-[#E60012]/40 scale-110 z-20' : 'z-10'}
        `;

        el.innerHTML = `
            <span class="w-7 h-7 rounded-full bg-[#E60012] flex items-center justify-center text-white text-[10px] font-bold tracking-tight">
                O!
            </span>
            <span class="status-dot absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style="background-color: ${statusColor};"></span>
            <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-[#252A30] text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-md pointer-events-none z-30">
                ${store.name} (${store.city || store.code})
            </span>
        `;

        // Keyboard support
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });

        el.addEventListener('click', () => {
            onStoreSelect?.(store);
            map.current?.flyTo({
                center: [store.longitude, store.latitude],
                zoom: 14,
                pitch: isTiltEnabled ? 15 : 0,
                duration: 800,
            });
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([store.longitude, store.latitude])
            .addTo(map.current!);

        markersRef.current.set(store.id, { marker, element: el, store, isVisible: true });
    };

    // ─── 5. Stable In-Place Marker Updates (Zero-Jitter & GPU-Friendly) ───────
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        const currentActiveIds = new Set(filteredStores.map((s) => s.id));

        // 5a. Remove only markers that are no longer in filteredStores
        markersRef.current.forEach((entry, id) => {
            if (!currentActiveIds.has(id)) {
                entry.marker.remove();
                markersRef.current.delete(id);
            }
        });

        // 5b. Update or Create markers in-place
        filteredStores.forEach((store) => {
            const isSelected = selectedStoreId === store.id;
            const existing = markersRef.current.get(store.id);

            const statusColor =
                store.markerStatus === 'online'
                    ? '#16834A'
                    : store.markerStatus === 'partial'
                    ? '#B7791F'
                    : store.markerStatus === 'offline'
                    ? '#C62828'
                    : '#68727D';

            if (existing) {
                // Update position smoothly
                existing.marker.setLngLat([store.longitude, store.latitude]);
                existing.store = store;
                existing.isVisible = true;

                // Update selected classes directly without destroying DOM
                if (isSelected) {
                    existing.element.classList.add('ring-3', 'ring-[#E60012]/40', 'scale-110', 'z-20');
                    existing.element.classList.remove('z-10');
                } else {
                    existing.element.classList.remove('ring-3', 'ring-[#E60012]/40', 'scale-110', 'z-20');
                    existing.element.classList.add('z-10');
                }

                // Update status dot color if it changed
                const dot = existing.element.querySelector('.status-dot') as HTMLElement | null;
                if (dot) {
                    dot.style.backgroundColor = statusColor;
                }

                // Update aria-label
                existing.element.setAttribute('aria-label', `${store.name} (${store.code}) — ${store.city}`);
            } else {
                // Create new marker instance
                createMarker(store);
            }
        });

        // Initial visibility check
        checkMarkerVisibility();
    }, [filteredStores, isLoaded, selectedStoreId, isTiltEnabled, checkMarkerVisibility]);

    // ─── 6. Fly To Specific Store ────────────────────────────────────────────
    const flyToStore = (store: StoreMarkerData) => {
        onStoreSelect?.(store);
        map.current?.flyTo({
            center: [store.longitude, store.latitude],
            zoom: 15,
            pitch: isTiltEnabled ? 18 : 0,
            duration: 900,
        });
    };

    // ─── 7. Toggle 2D / 3D Tilt View & 3D Building Layer ─────────────────────
    const toggleTilt = () => {
        if (!map.current) return;
        const newTilt = !isTiltEnabled;
        setIsTiltEnabled(newTilt);

        const targetPitch = newTilt ? Math.min(tileConfig.maxPitch || 20, 18) : 0;

        map.current.easeTo({
            pitch: targetPitch,
            duration: 500,
        });

        // Toggle 3D extrusion building visibility if layer is present
        if (map.current.getLayer('3d-buildings')) {
            map.current.setLayoutProperty(
                '3d-buildings',
                'visibility',
                newTilt ? 'visible' : 'none'
            );
        }
    };

    // ─── 8. Reset View ────────────────────────────────────────────────────────
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

        if (map.current.getLayer('3d-buildings')) {
            map.current.setLayoutProperty('3d-buildings', 'visibility', 'none');
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="relative w-full h-full">
            {/* Map Canvas */}
            <div ref={mapContainer} className="w-full h-full" role="application" aria-label="Peta monitoring store O!Save" />

            {/* Map Loading Skeleton */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-[#F4F5F6] flex items-center justify-center z-10" aria-hidden="true">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 border-4 border-[#E60012] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-medium text-[#68727D]">Memuat peta...</p>
                    </div>
                </div>
            )}

            {/* Marker Loading Skeleton (show while markers loading) */}
            {isLoaded && !markersLoaded && filteredStores.length > 0 && (
                <div className="absolute inset-0 pointer-events-none z-5" aria-hidden="true">
                    {filteredStores.slice(0, 10).map((store) => (
                        <SkeletonMapMarker
                            key={store.id}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}
                </div>
            )}

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
                    aria-pressed={statusFilter === 'all'}
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
                    aria-pressed={statusFilter === 'online'}
                >
                    <span className="w-2 h-2 rounded-full bg-[#16834A]" aria-hidden="true" />
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
                    aria-pressed={statusFilter === 'partial'}
                >
                    <span className="w-2 h-2 rounded-full bg-[#B7791F]" aria-hidden="true" />
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
                    aria-pressed={statusFilter === 'offline'}
                >
                    <span className="w-2 h-2 rounded-full bg-[#C62828]" aria-hidden="true" />
                    <span>Offline</span>
                </button>
            </div>

            {/* Search Dropdown Indicator if Query entered */}
            {searchQuery.trim().length > 0 && (
                <div className="absolute top-16 left-4 z-20 w-80 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] max-h-72 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-1 duration-150" role="listbox" aria-label="Hasil pencarian store">
                    <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-[#E0E4E8] mb-1">
                        <p className="text-[10px] uppercase font-semibold text-[#68727D] tracking-wider">
                            Hasil Pencarian ({filteredStores.length})
                        </p>
                        {isSearchingAjax && (
                            <span className="text-[10px] text-[#E60012] animate-pulse" aria-live="polite">Mencari...</span>
                        )}
                    </div>

                    {filteredStores.length === 0 ? (
                        <div className="p-4 text-center text-[#68727D]" role="option" aria-selected="false">
                            <p className="text-xs">Tidak ditemukan toko untuk "{searchQuery}"</p>
                            <p className="text-[10px] text-[#A0AEC0] mt-1">Coba cari dengan nama toko, kota (contoh: Kemang, Dago, Bandung), atau kode store.</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filteredStores.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => flyToStore(s)}
                                    role="option"
                                    aria-selected={selectedStoreId === s.id}
                                    className="w-full text-left px-2.5 py-2 rounded-[var(--radius-control)] hover:bg-[#EEF0F2] flex items-center justify-between transition-colors group"
                                >
                                    <div className="flex-1 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-semibold text-[#252A30] group-hover:text-[#E60012] transition-colors leading-tight">
                                                {s.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#68727D]">
                                            <span className="font-mono bg-[#EEF0F2] px-1 py-0.2 rounded">{s.code}</span>
                                            {s.city && (
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin className="w-2.5 h-2.5 text-[#A0AEC0]" aria-hidden="true" />
                                                    {s.city}
                                                </span>
                                            )}
                                        </div>
                                        {s.address && (
                                            <p className="text-[10px] text-[#8C9BA5] truncate max-w-[220px] mt-0.5">
                                                {s.address}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0 ml-1"
                                        title={`Status: ${s.markerStatus}`}
                                        style={{
                                            backgroundColor:
                                                s.markerStatus === 'online'
                                                    ? '#16834A'
                                                    : s.markerStatus === 'partial'
                                                    ? '#B7791F'
                                                    : '#C62828',
                                        }}
                                        aria-label={`Status: ${s.markerStatus}`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Floating Map Controls — Top Right */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
                {/* 2D / 3D Tilt Toggle */}
                <button
                    type="button"
                    onClick={toggleTilt}
                    title={isTiltEnabled ? 'Kembali ke tampilan datar 2D' : 'Aktifkan sudut perspektif 3D'}
                    className={`w-9 h-9 rounded-[var(--radius-control)] bg-white border border-[#E0E4E8] flex items-center justify-center text-xs font-bold shadow-[var(--shadow-raised)] transition-colors ${
                        isTiltEnabled ? 'bg-[#FCE8EA] text-[#E60012] border-[#E60012]/30' : 'text-[#252A30] hover:bg-[#EEF0F2]'
                    }`}
                    aria-pressed={isTiltEnabled}
                    aria-label={isTiltEnabled ? 'Mode 3D aktif' : 'Mode 2D aktif'}
                >
                    {isTiltEnabled ? '3D' : '2D'}
                </button>

                {/* Reset view */}
                <button
                    type="button"
                    onClick={resetView}
                    title="Reset tampilan peta ke default"
                    className="w-9 h-9 rounded-[var(--radius-control)] bg-white border border-[#E0E4E8] flex items-center justify-center text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] shadow-[var(--shadow-raised)] transition-colors"
                    aria-label="Reset tampilan peta"
                >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>

            {/* Map Status Legend — Bottom Left */}
            <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur-xs border border-[#E0E4E8] rounded-[var(--radius-card)] p-2.5 shadow-[var(--shadow-raised)] z-10 text-[11px] select-none" role="region" aria-label="Legenda status store">
                <p className="font-semibold text-[#252A30] mb-1.5 uppercase tracking-wider text-[10px]">
                    Status Store
                </p>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#16834A]" aria-hidden="true" />
                        <span className="text-[#252A30]">Online</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#B7791F]" aria-hidden="true" />
                        <span className="text-[#252A30]">Sebagian</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C62828]" aria-hidden="true" />
                        <span className="text-[#252A30]">Offline</span>
                    </span>
                </div>
            </div>
        </div>
    );
};