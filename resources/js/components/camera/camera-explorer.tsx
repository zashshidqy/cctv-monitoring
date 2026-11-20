import React, { useState, useCallback, useMemo } from 'react';
import { Grid, Maximize2, Minimize2, Settings, X, Loader2, Video, RotateCcw } from 'lucide-react';
import { CameraPlayer } from './camera-player';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import type { CameraCardData } from '@/types';

type GridSize = 1 | 4 | 9 | 16;

interface CameraExplorerProps {
    cameras: CameraCardData[];
    onCameraSelect?: (camera: CameraCardData) => void;
    isLoading?: boolean;
}

const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center text-center text-[#A0AAB5] p-6">
        <Video className="w-12 h-12 text-[#68727D] mb-3 opacity-50" aria-hidden="true" />
        <p className="text-sm font-medium text-[#252A30]">Belum Ada Kamera Terdaftar</p>
        <p className="text-xs text-[#8C9BA5] mt-1 max-w-sm">
            Toko ini belum memiliki kamera aktif yang terhubung ke gateway monitoring.
        </p>
    </div>
);

const SkeletonGrid = ({ gridSize, gridCols }: { gridSize: GridSize; gridCols: string }) => (
    <div className={'grid ' + gridCols + ' gap-3 h-full'} role="list" aria-label="Mosaic kamera" aria-busy="true">
        {Array.from({ length: gridSize }).map((_, idx) => (
            <SkeletonCard key={`skeleton-${idx}`} className="aspect-video" />
        ))}
    </div>
);

const SkeletonFocusedView = () => (
    <div className="h-full flex items-center justify-center animate-in fade-in zoom-in duration-150" aria-busy="true">
        <div className="w-full max-w-4xl aspect-video">
            <Skeleton className="w-full h-full rounded-[var(--radius-card)] bg-[#1E2329]" />
        </div>
    </div>
);

const FocusedView = ({
    focusedCamera,
    activeSessions,
    handleReleaseFocus,
    handleRetry,
}: {
    focusedCamera: CameraCardData;
    activeSessions: Record<number, { url: string; protocol: 'webrtc' | 'hls' | 'mjpeg' | 'youtube_live' }>;
    handleReleaseFocus: () => void;
    handleRetry: (camera: CameraCardData) => void;
}) => (
    <div className="h-full flex items-center justify-center animate-in fade-in zoom-in duration-150">
        <div className="w-full max-w-4xl aspect-video">
            <CameraPlayer
                camera={focusedCamera}
                sessionUrl={activeSessions[focusedCamera.id]?.url || '/playback/stream/placeholder'}
                protocol={activeSessions[focusedCamera.id]?.protocol || (focusedCamera.connectionType === 'youtube_live' ? 'youtube_live' : 'webrtc')}
                onClose={handleReleaseFocus}
                onRetry={() => handleRetry(focusedCamera)}
                onFullscreen={() => {}}
                isFocused={true}
            />
        </div>
    </div>
);

const MosaicGrid = ({
    cameras,
    gridSize,
    displayedCameras,
    gridCols,
    activeSessions,
    loadingIds,
    startSession,
    handleFocus,
    handleRetry,
}: {
    cameras: CameraCardData[];
    gridSize: GridSize;
    displayedCameras: CameraCardData[];
    gridCols: string;
    activeSessions: Record<number, { url: string; protocol: 'webrtc' | 'hls' | 'mjpeg' | 'youtube_live' }>;
    loadingIds: Set<number>;
    startSession: (camera: CameraCardData) => void;
    handleFocus: (camera: CameraCardData) => void;
    handleRetry: (camera: CameraCardData) => void;
}) => (
    <div className={'grid ' + gridCols + ' gap-3 h-full'} role="list" aria-label="Mosaic kamera">
        {displayedCameras.map((camera) => {
            const session = activeSessions[camera.id];
            const isStreaming = !!session;
            const isLoading = loadingIds.has(camera.id);

            return (
                <article
                    key={camera.id}
                    className="relative bg-[#15191D] rounded-[var(--radius-card)] overflow-hidden group border border-[#252A30]"
                    role="listitem"
                >
                    {/* Camera Card */}
                    <div className="aspect-video relative">
                        {!isStreaming ? (
                            <div
                                onClick={() => !isLoading && startSession(camera)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startSession(camera); } }}
                                tabIndex={0}
                                role="button"
                                aria-label={isLoading ? `Menyiapkan stream untuk ${camera.name}` : `Mulai stream ${camera.name}`}
                                className="w-full h-full flex flex-col items-center justify-center text-[#A0AAB5] p-3 cursor-pointer hover:bg-[#1E2329] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E60012]/40"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-8 h-8 text-[#E60012] animate-spin mb-2" aria-hidden="true" />
                                ) : (
                                    <Video className="w-8 h-8 text-[#E60012]/60 mb-2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                                )}
                                <p className="text-xs font-semibold text-white text-center mb-0.5">{camera.name}</p>
                                <span className="text-[10px] text-[#8C9BA5] mb-1">{camera.areaLabel}</span>
                                <StatusBadge status={camera.status} />
                                <p className="text-[10px] mt-2 text-[#68727D]">
                                    {isLoading ? 'Menyiapkan stream...' : 'Klik untuk putar stream'}
                                </p>
                            </div>
                        ) : (
                            <CameraPlayer
                                camera={camera}
                                sessionUrl={session.url}
                                protocol={session.protocol}
                                onClose={() => {}}
                                onRetry={() => handleRetry(camera)}
                                onFullscreen={() => handleFocus(camera)}
                                isFocused={false}
                            />
                        )}

                        {/* Play Indicator */}
                        {isStreaming && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none" aria-live="polite">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16834A] animate-pulse" aria-hidden="true" />
                                LIVE
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/95 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        {!isStreaming ? (
                            <Button
                                variant="default"
                                size="sm"
                                disabled={isLoading}
                                onClick={(e) => { e.stopPropagation(); startSession(camera); }}
                                className="gap-1.5 flex-1 justify-center bg-[#E60012] hover:bg-[#CC0010] text-xs h-7"
                                aria-label={isLoading ? `Menghubungkan ${camera.name}...` : `Mulai stream ${camera.name}`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Video className="w-3 h-3" aria-hidden="true" />
                                )}
                                <span>{isLoading ? 'Menghubungkan...' : 'Mulai Stream'}</span>
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleFocus(camera); }}
                                    className="gap-1.5 text-white hover:bg-white/10 text-xs h-7"
                                    aria-label={`Fokus ke ${camera.name}`}
                                >
                                    <Maximize2 className="w-3 h-3" aria-hidden="true" />
                                    <span className="hidden sm:inline">Fokus</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleRetry(camera); }}
                                    className="gap-1.5 text-white hover:bg-white/10 text-xs h-7"
                                    aria-label={`Refresh stream ${camera.name}`}
                                >
                                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                                    <span className="hidden sm:inline">Refresh</span>
                                </Button>
                            </>
                        )}
                    </div>
                </article>
            );
        })}

        {/* Empty Slots for incomplete grids */}
        {displayedCameras.length < gridSize && Array.from({ length: gridSize - displayedCameras.length }).map((_, idx) => (
            <div
                key={'empty-' + idx}
                className="bg-[#15191D] rounded-[var(--radius-card)] border border-dashed border-[#252A30] flex items-center justify-center p-4 text-[#4A5568] text-xs"
                aria-hidden="true"
            >
                Slot Kamera Kosong
            </div>
        ))}
    </div>
);

export const CameraExplorer: React.FC<CameraExplorerProps> = ({
    cameras,
    onCameraSelect,
    isLoading = false,
}) => {
    const [gridSize, setGridSize] = useState<GridSize>(4);
    const [focusedCamera, setFocusedCamera] = useState<CameraCardData | null>(null);
    const [activeSessions, setActiveSessions] = useState<Record<number, { url: string; protocol: 'webrtc' | 'hls' | 'mjpeg' | 'youtube_live' }>>({});
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

    const startSession = useCallback(async (camera: CameraCardData) => {
        setLoadingIds((prev) => new Set(prev).add(camera.id));
        try {
            const preferredProtocol = camera.connectionType === 'youtube_live' ? 'youtube_live' : 'webrtc';
            const res = await fetch('/playback/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ camera_id: camera.id, protocol: preferredProtocol }),
            });

            if (res.ok) {
                const data = await res.json();
                setActiveSessions((prev) => ({
                    ...prev,
                    [camera.id]: { url: data.playbackUrl, protocol: data.protocol },
                }));
            }
        } catch (err) {
            console.error('Failed to start playback session:', err);
        } finally {
            setLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(camera.id);
                return next;
            });
        }
    }, []);

    const handleRetry = useCallback((camera: CameraCardData) => {
        setActiveSessions((prev) => {
            const updated = { ...prev };
            delete updated[camera.id];
            return updated;
        });
        startSession(camera);
    }, [startSession]);

    const handleFocus = useCallback((camera: CameraCardData) => {
        setFocusedCamera(camera);
        onCameraSelect?.(camera);
    }, [onCameraSelect]);

    const handleReleaseFocus = useCallback(() => {
        setFocusedCamera(null);
    }, []);

    // Calculate grid columns
    const gridCols = { 1: 'grid-cols-1', 4: 'grid-cols-2', 9: 'grid-cols-3', 16: 'grid-cols-4' }[gridSize];
    const displayedCameras = cameras.slice(0, gridSize);
    const activeStreamCount = Object.keys(activeSessions).length;

    // Render grid area content
    const renderGridArea = () => {
        // Show skeleton while initial data is loading
        if (isLoading) {
            if (focusedCamera) {
                return <SkeletonFocusedView />;
            }
            return <SkeletonGrid gridSize={gridSize} gridCols={gridCols} />;
        }

        if (cameras.length === 0) {
            return <EmptyState />;
        }

        if (focusedCamera) {
            return (
                <FocusedView
                    focusedCamera={focusedCamera}
                    activeSessions={activeSessions}
                    handleReleaseFocus={handleReleaseFocus}
                    handleRetry={handleRetry}
                />
            );
        }

        return (
            <MosaicGrid
                cameras={cameras}
                gridSize={gridSize}
                displayedCameras={displayedCameras}
                gridCols={gridCols}
                activeSessions={activeSessions}
                loadingIds={loadingIds}
                startSession={startSession}
                handleFocus={handleFocus}
                handleRetry={handleRetry}
            />
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#15191D] rounded-[var(--radius-panel)] overflow-hidden">
            {/* Explorer Header */}
            <div className="p-3 border-b border-[#252A30] bg-[#1A1F25] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#E60012] rounded flex items-center justify-center text-white text-[10px] font-bold" aria-hidden="true">
                        ▣
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Camera Explorer</p>
                        <p className="text-[10px] text-[#A0AAB5]">
                            {cameras.length} kamera tersedia • {activeStreamCount} stream aktif
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Grid Size Selector */}
                    <div className="flex items-center gap-1 bg-[#15191D] rounded-[var(--radius-control)] p-0.5" role="group" aria-label="Ukuran grid kamera">
                        {[1, 4, 9, 16].map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => setGridSize(size as GridSize)}
                                className={'px-2 py-1 rounded text-[10px] font-semibold font-mono transition-colors ' + (
                                    gridSize === size
                                        ? 'bg-[#E60012] text-white shadow-xs'
                                        : 'text-[#A0AAB5] hover:text-white hover:bg-[#252A30]'
                                )}
                                aria-pressed={gridSize === size}
                                aria-label={`${size === 1 ? '1×1' : size === 4 ? '2×2' : size === 9 ? '3×3' : '4×4'} grid`}
                            >
                                {size === 1 ? '1×1' : size === 4 ? '2×2' : size === 9 ? '3×3' : '4×4'}
                            </button>
                        ))}
                    </div>

                    {focusedCamera && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReleaseFocus}
                            className="gap-1.5 text-white hover:bg-[#252A30]"
                            aria-label="Kembali ke tampilan grid"
                        >
                            <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Kembali ke Grid</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-auto p-3">
                {renderGridArea()}
            </div>
        </div>
    );
};