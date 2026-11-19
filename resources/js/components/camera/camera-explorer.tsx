import React, { useState, useCallback, useMemo } from 'react';
import { Grid, Maximize2, Minimize2, Settings, X, Loader2 } from 'lucide-react';
import { CameraPlayer } from './camera-player';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import type { CameraCardData } from '@/types';

type GridSize = 1 | 4 | 9 | 16;

interface CameraExplorerProps {
    cameras: CameraCardData[];
    onCameraSelect?: (camera: CameraCardData) => void;
}

export const CameraExplorer: React.FC<CameraExplorerProps> = ({
    cameras,
    onCameraSelect,
}) => {
    const [gridSize, setGridSize] = useState<GridSize>(4);
    const [focusedCamera, setFocusedCamera] = useState<CameraCardData | null>(null);
    const [activeSessions, setActiveSessions] = useState<Record<number, { url: string; protocol: 'webrtc' | 'hls' | 'mjpeg' }>>({});

    const startSession = useCallback(async (camera: CameraCardData) => {
        try {
            const res = await fetch('/playback/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ camera_id: camera.id, protocol: 'webrtc' }),
            });

            if (res.ok) {
                const data = await res.json();
                setActiveSessions(prev => ({ ...prev, [camera.id]: { url: data.playbackUrl, protocol: data.protocol } }));
            }
        } catch (err) {
            console.error('Failed to start playback session:', err);
        }
    }, []);

    const handleRetry = useCallback((camera: CameraCardData) => {
        // Trigger session refresh
        setActiveSessions(prev => {
            const updated = { ...prev };
            delete updated[camera.id];
            return updated;
        });
        // Restart session
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

    return (
        <div className="flex flex-col h-full bg-[#15191D] rounded-[var(--radius-panel)] overflow-hidden">
            {/* Explorer Header */}
            <div className="p-3 border-b border-[#252A30] bg-[#1A1F25] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#E60012] rounded flex items-center justify-center text-white text-[10px] font-bold">
                        ▣
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Camera Explorer</p>
                        <p className="text-[10px] text-[#A0AAB5]">
                            {cameras.length} kamera tersedia • {activeSessions.length > 0 ? activeSessions.length : 0} stream aktif
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Grid Size Selector */}
                    <div className="flex items-center gap-1 bg-[#15191D] rounded-[var(--radius-control)] p-0.5">
                        {[1, 4, 9, 16].map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => setGridSize(size as GridSize)}
                                className={`p-1.5 rounded text-[10px] font-semibold font-mono transition-colors ${
                                    gridSize === size
                                        ? 'bg-[#E60012] text-white shadow-xs'
                                        : 'text-[#A0AAB5] hover:text-white hover:bg-[#252A30]'
                                }`}
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
                            className="gap-1.5 text-white"
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                            <span>Kembali ke Grid</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-auto p-3">
                {focusedCamera ? (
                    {/* Focused View - Single Camera Full Size */}
                    <div className="h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-full max-w-4xl aspect-video">
                            <CameraPlayer
                                camera={focusedCamera}
                                sessionUrl={activeSessions[focusedCamera.id]?.url || '/playback/stream/placeholder'}
                                protocol={activeSessions[focusedCamera.id]?.protocol || 'webrtc'}
                                onClose={handleReleaseFocus}
                                onRetry={() => handleRetry(focusedCamera)}
                                onFullscreen={() => {}}
                                isFocused={true}
                            />
                        </div>
                    </div>
                ) : (
                    {/* Mosaic Grid */}
                    <div
                        className={`grid ${gridCols} gap-3 h-full`}
                        role="list"
                        aria-label="Mosaic kamera"
                    >
                        {displayedCameras.map((camera) => {
                            const session = activeSessions[camera.id];
                            const isStreaming = !!session;

                            return (
                                <article
                                    key={camera.id}
                                    className="relative bg-[#15191D] rounded-[var(--radius-card)] overflow-hidden group"
                                    role="listitem"
                                >
                                    {/* Camera Card */}
                                    <div className="aspect-video relative">
                                        {!isStreaming ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-[#A0AAB5] p-3">
                                                <Video className="w-10 h-10 text-[#E60012]/50 mb-2" />
                                                <p className="text-xs font-semibold text-white text-center mb-0.5">{camera.name}</p>
                                                <StatusBadge status={camera.status} />
                                                <p className="text-[10px] mt-1 text-center">Klik untuk memulai stream</p>
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

                                        {/* Camera Label Overlay (when not playing) */}
                                        {!isStreaming && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-end p-2 pointer-events-none bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-white font-medium text-xs text-center w-full truncate">{camera.name}</p>
                                            </div>
                                        )}

                                        {/* Play Indicator */}
                                        {isStreaming && !focusedCamera && (
                                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#16834A] animate-pulse" />
                                                LIVE
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Footer */}
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                        {!isStreaming ? (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); startSession(camera); }}
                                                className="gap-1.5 flex-1 justify-center"
                                            >
                                                <Loader2 className="w-3.5 h-3.5" />
                                                <span>Mulai Stream</span>
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleFocus(camera); }}
                                                    className="gap-1.5 text-white"
                                                >
                                                    <Maximize2 className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">Fokus</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleRetry(camera); }}
                                                    className="gap-1.5 text-white"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
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
                                key={`empty-${idx}`}
                                className="bg-[#15191D] rounded-[var(--radius-card)] border border-dashed border-[#252A30]"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};