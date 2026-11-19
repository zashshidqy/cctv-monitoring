import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Grid, Video, VideoOff, RotateCcw, Settings, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import type { CameraCardData } from '@/types';

interface CameraPlayerProps {
    camera: CameraCardData;
    sessionUrl: string;
    protocol: 'webrtc' | 'hls' | 'mjpeg';
    onClose: () => void;
    onRetry: () => void;
    onFullscreen: () => void;
    isFocused?: boolean;
}

export const CameraPlayer: React.FC<CameraPlayerProps> = ({
    camera,
    sessionUrl,
    protocol,
    onClose,
    onRetry,
    onFullscreen,
    isFocused = false,
}) => {
    const [state, setState] = useState<'connecting' | 'playing' | 'reconnecting' | 'offline' | 'unsupported' | 'error'>('connecting');
    const [latencyMs, setLatencyMs] = useState<number | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // Heartbeat keepalive
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                await fetch(`/playback/sessions/heartbeat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                });
            } catch {}
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleLoad = useCallback(() => {
        if (state === 'connecting' || state === 'reconnecting') {
            setState('playing');
        }
        setLatencyMs(performance.now());
    }, [state]);

    const handleError = useCallback(() => {
        if (state !== 'error' && state !== 'offline') {
            setState('reconnecting');
            setTimeout(() => setState('error'), 2000);
        }
    }, [state]);

    const isPlaying = state === 'playing';
    const showControls = isFocused || state !== 'playing';

    return (
        <div className={`relative bg-[#15191D] rounded-[var(--radius-card)] overflow-hidden ${isFocused ? 'z-30' : ''}`}>
            {/* Video Layer */}
            <div className="w-full aspect-video relative">
                {state === 'playing' && (
                    <img
                        ref={imgRef}
                        src={sessionUrl}
                        alt={`${camera.name} live stream`}
                        className="w-full h-full object-cover"
                        onLoad={handleLoad}
                        onError={handleError}
                    />
                )}

                {state !== 'playing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#15191D] text-white">
                        {state === 'connecting' && (
                            <div className="space-y-2">
                                <Loader2 className="w-8 h-8 text-[#E60012] animate-spin" />
                                <p className="text-sm font-mono">Menghubungkan ke gateway...</p>
                            </div>
                        )}
                        {state === 'reconnecting' && (
                            <div className="space-y-2">
                                <RotateCcw className="w-8 h-8 text-[#B7791F] animate-spin" />
                                <p className="text-sm font-mono">Menyambung ulang...</p>
                            </div>
                        )}
                        {state === 'offline' && (
                            <div className="space-y-2 text-center">
                                <VideoOff className="w-10 h-10 text-[#C62828]" />
                                <p className="font-semibold">Kamera Offline</p>
                                <p className="text-xs text-[#A0AAB5]">Tidak ada respons dari gateway</p>
                            </div>
                        )}
                        {state === 'error' && (
                            <div className="space-y-2 text-center">
                                <AlertTriangle className="w-10 h-10 text-[#C62828]" />
                                <p className="font-semibold">Gagal Memuat Stream</p>
                                <p className="text-xs text-[#A0AAB5]">Mungkin codec tidak didukung atau jaringan terputus</p>
                            </div>
                        )}
                        {state === 'unsupported' && (
                            <div className="space-y-2 text-center">
                                <AlertTriangle className="w-10 h-10 text-[#B7791F]" />
                                <p className="font-semibold">Format Tidak Didukung</p>
                                <p className="text-xs text-[#A0AAB5]">Browser tidak mendukung protokol ini</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Retry Overlay */}
                {(state === 'error' || state === 'offline') && (
                    <div className="absolute inset-0 flex items-end justify-center p-4 pointer-events-none">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="gap-1.5 pointer-events-auto bg-white/90"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Coba Lagi</span>
                        </Button>
                    </div>
                )}

                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Top HUD */}
                    <div className="absolute top-0 left-0 right-0 p-2 flex items-start justify-between pointer-events-auto">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-[#E60012] rounded flex items-center justify-center text-white text-[10px] font-bold">
                                {state === 'playing' ? '●' : '○'}
                            </span>
                            <span className={`text-[11px] font-mono ${state === 'playing' ? 'text-[#16834A]' : 'text-[#C62828]'}`}>
                                {state.toUpperCase()}
                            </span>
                            {latencyMs && state === 'playing' && (
                                <span className="text-[10px] text-[#A0AAB5] font-mono">
                                    ~{Math.round(latencyMs)}ms
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono uppercase bg-black/50 text-white px-1.5 py-0.5 rounded">
                                {protocol.toUpperCase()}
                            </span>
                            {isFocused && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onFullscreen}
                                    className="text-white hover:bg-white/10"
                                >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bottom HUD */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto flex items-end justify-between">
                        <div>
                            <p className="text-white font-medium text-sm">{camera.name}</p>
                            <p className="text-[10px] text-[#A0AAB5]">{camera.areaLabel}</p>
                        </div>
                        <p className="text-[10px] font-mono text-[#A0AAB5]">
                            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Focus Mode Controls */}
            {isFocused && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between pointer-events-auto">
                    <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-white">
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Tutup Fokus</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onRetry} className="gap-1.5 text-white">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refresh Stream</span>
                    </Button>
                </div>
            )}
        </div>
    );
};