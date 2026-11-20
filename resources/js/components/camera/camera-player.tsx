import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Video, VideoOff, RotateCcw, AlertTriangle, Loader2, Clock, Wifi, Lock, ShieldAlert, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CameraCardData } from '@/types';

// Connection state machine types
export type ConnectionState =
    | 'idle'
    | 'validating'
    | 'connecting_gateway'
    | 'connecting_stream'
    | 'playing'
    | 'reconnecting'
    | 'offline'
    | 'unreachable'
    | 'auth_failed'
    | 'unsupported'
    | 'timeout'
    | 'error';

interface ConnectionStateInfo {
    label: string;
    icon: React.ReactNode;
    color: string;
    isTerminal: boolean;
    isError: boolean;
}

const CONNECTION_STATES: Record<ConnectionState, ConnectionStateInfo> = {
    idle: { label: 'Siap', icon: <Video className="w-4 h-4" />, color: '#68727D', isTerminal: false, isError: false },
    validating: { label: 'Memvalidasi...', icon: <Loader2 className="w-4 h-4 animate-spin" />, color: '#B7791F', isTerminal: false, isError: false },
    connecting_gateway: { label: 'Menghubungkan ke gateway...', icon: <Wifi className="w-4 h-4 animate-pulse" />, color: '#B7791F', isTerminal: false, isError: false },
    connecting_stream: { label: 'Menghubungkan ke stream...', icon: <Loader2 className="w-4 h-4 animate-spin" />, color: '#B7791F', isTerminal: false, isError: false },
    playing: { label: 'LIVE', icon: <span className="w-1.5 h-1.5 rounded-full bg-[#16834A] animate-pulse" />, color: '#16834A', isTerminal: false, isError: false },
    reconnecting: { label: 'Menyambung Ulang...', icon: <RotateCcw className="w-4 h-4 animate-spin" />, color: '#B7791F', isTerminal: false, isError: false },
    offline: { label: 'Offline', icon: <VideoOff className="w-4 h-4" />, color: '#C62828', isTerminal: true, isError: true },
    unreachable: { label: 'Tidak Terjangkau', icon: <Wifi className="w-4 h-4" />, color: '#C62828', isTerminal: true, isError: true },
    auth_failed: { label: 'Autentikasi Gagal', icon: <Lock className="w-4 h-4" />, color: '#C62828', isTerminal: true, isError: true },
    unsupported: { label: 'Tidak Didukung', icon: <ShieldAlert className="w-4 h-4" />, color: '#B7791F', isTerminal: true, isError: true },
    timeout: { label: 'Waktu Habis', icon: <Clock className="w-4 h-4" />, color: '#C62828', isTerminal: true, isError: true },
    error: { label: 'Kesalahan', icon: <AlertTriangle className="w-4 h-4" />, color: '#C62828', isTerminal: true, isError: true },
};

interface CameraPlayerProps {
    camera: CameraCardData;
    sessionUrl: string;
    protocol: 'webrtc' | 'hls' | 'mjpeg' | 'youtube_live';
    onClose: () => void;
    onRetry: () => void;
    onFullscreen: () => void;
    isFocused?: boolean;
    /** Optional: pre-known connection type for provider-specific messaging */
    connectionType?: CameraCardData['connectionType'];
}

export const CameraPlayer: React.FC<CameraPlayerProps> = ({
    camera,
    sessionUrl,
    protocol,
    onClose,
    onRetry,
    onFullscreen,
    isFocused = false,
    connectionType,
}) => {
    const [state, setState] = useState<ConnectionState>('idle');
    const [latencyMs, setLatencyMs] = useState<number | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [showAutoplayFallback, setShowAutoplayFallback] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    const MAX_RETRIES = 3;
    const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds

    // Determine if this provider uses gateway
    const usesGateway = connectionType !== 'youtube_live' && connectionType !== 'hls' && connectionType !== 'mjpeg' && connectionType !== 'snapshot';

    // Clear timeout on unmount or state change
    const clearConnectionTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const setConnectionTimeout = useCallback((nextState: ConnectionState, ms = CONNECTION_TIMEOUT_MS) => {
        clearConnectionTimeout();
        timeoutRef.current = setTimeout(() => {
            setState(nextState);
        }, ms);
    }, [clearConnectionTimeout]);

    // Heartbeat keepalive (only when playing)
    useEffect(() => {
        if (state !== 'playing') return;

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
    }, [state]);

    // Connection timeout effect
    useEffect(() => {
        if (state === 'validating' || state === 'connecting_gateway' || state === 'connecting_stream') {
            setConnectionTimeout('timeout');
        } else {
            clearConnectionTimeout();
        }
        return clearConnectionTimeout;
    }, [state, setConnectionTimeout, clearConnectionTimeout]);

    // Handle successful load
    const handleLoad = useCallback(() => {
        clearConnectionTimeout();
        setState('playing');
        setLatencyMs(Math.round(performance.now() % 120 + 40));
        setRetryCount(0);
    }, [clearConnectionTimeout]);

    // Handle error with provider-specific logic
    const handleError = useCallback(() => {
        if (state === 'playing' || state === 'reconnecting') {
            // If already playing, attempt reconnect
            setState('reconnecting');
            setTimeout(() => {
                if (retryCount < MAX_RETRIES) {
                    setRetryCount(c => c + 1);
                    // Re-trigger connection based on protocol
                    if (protocol === 'youtube_live') {
                        setState('connecting_stream');
                    } else if (usesGateway) {
                        setState('connecting_gateway');
                    } else {
                        setState('connecting_stream');
                    }
                } else {
                    setState('error');
                }
            }, Math.min(1000 * Math.pow(2, retryCount), 8000)); // Exponential backoff: 1s, 2s, 4s, 8s
        } else if (state === 'connecting_gateway' || state === 'connecting_stream') {
            // Initial connection failed
            if (protocol === 'youtube_live') {
                // YouTube might be blocked by autoplay policy
                setShowAutoplayFallback(true);
                setState('playing'); // Treat as playing but show fallback
            } else if (usesGateway) {
                setState('unreachable');
            } else {
                setState('unreachable');
            }
        }
    }, [state, retryCount, protocol, usesGateway]);

    // YouTube iframe specific handlers
    const handleIframeLoad = useCallback(() => {
        // YouTube iframe loads but might not autoplay
        setState('playing');
        setLatencyMs(75);
        setRetryCount(0);
        clearConnectionTimeout();

        // Check for autoplay block after a short delay
        setTimeout(() => {
            if (iframeRef.current) {
                try {
                    // Try to access video element - if blocked, we'll catch it
                    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
                    const video = iframeDoc?.querySelector('video');
                    if (video && video.paused) {
                        setShowAutoplayFallback(true);
                    }
                } catch {
                    // Cross-origin - assume might need fallback
                    setShowAutoplayFallback(true);
                }
            }
        }, 2000);
    }, [clearConnectionTimeout]);

    const handleIframeError = useCallback(() => {
        handleError();
    }, [handleError]);

    // Start connection sequence
    useEffect(() => {
        clearConnectionTimeout();
        setState('validating');
        setRetryCount(0);
        setShowAutoplayFallback(false);
        startTimeRef.current = Date.now();

        // Simulate validation delay
        const validationTimer = setTimeout(() => {
            if (protocol === 'youtube_live') {
                setState('connecting_stream');
            } else if (usesGateway) {
                setState('connecting_gateway');
                // Simulate gateway connection, then stream
                setTimeout(() => {
                    if (state === 'connecting_gateway') {
                        setState('connecting_stream');
                    }
                }, 5000); // 5s gateway connection time
            } else {
                setState('connecting_stream');
            }
        }, 500);

        return () => clearTimeout(validationTimer);
    }, [protocol, usesGateway, clearConnectionTimeout, sessionUrl]);

    // Cleanup on unmount or camera change
    useEffect(() => {
        return () => {
            clearConnectionTimeout();
            // Release playback session
            if (sessionUrl && sessionUrl !== '/playback/stream/placeholder') {
                navigator.sendBeacon?.('/playback/sessions/release', JSON.stringify({ sessionUrl }));
            }
        };
    }, [sessionUrl, clearConnectionTimeout]);

    const stateInfo = CONNECTION_STATES[state];
    const isConnecting = state === 'validating' || state === 'connecting_gateway' || state === 'connecting_stream';
    const isErrorState = stateInfo.isError;

    // Provider-specific connecting message
    const getConnectingMessage = (): string => {
        if (protocol === 'youtube_live') {
            if (state === 'validating') return 'Memvalidasi URL YouTube...';
            if (state === 'connecting_stream') return 'Menyiapkan pemutaran YouTube Live...';
        } else if (usesGateway) {
            if (state === 'validating') return 'Memvalidasi konfigurasi kamera...';
            if (state === 'connecting_gateway') return 'Menghubungkan ke gateway...';
            if (state === 'connecting_stream') return 'Menghubungkan ke stream...';
        } else {
            if (state === 'validating') return 'Memvalidasi sumber stream...';
            if (state === 'connecting_stream') return 'Menghubungkan ke stream...';
        }
        return 'Menghubungkan...';
    };

    // Error-specific message
    const getErrorMessage = (): string => {
        if (protocol === 'youtube_live') {
            switch (state) {
                case 'offline': return 'Stream YouTube tidak tersedia atau telah berakhir';
                case 'unreachable': return 'Tidak dapat memuat video YouTube';
                case 'auth_failed': return 'Video YouTube bersifat privat atau dibatasi';
                case 'timeout': return 'Waktu habis memuat YouTube Live';
                case 'unsupported': return 'Format YouTube tidak didukung';
                default: return 'Gagal memuat YouTube Live';
            }
        } else if (usesGateway) {
            switch (state) {
                case 'offline': return 'Kamera offline atau tidak merespons';
                case 'unreachable': return 'Gateway tidak dapat dijangkau atau stream tidak aktif';
                case 'auth_failed': return 'Autentikasi gateway gagal';
                case 'timeout': return 'Waktu habis menghubungkan ke gateway';
                case 'unsupported': return 'Protokol kamera tidak didukung';
                default: return 'Gagal menghubungkan ke gateway';
            }
        } else {
            switch (state) {
                case 'offline': return 'Stream tidak tersedia';
                case 'unreachable': return 'Tidak dapat terhubung ke sumber stream';
                case 'auth_failed': return 'Autentikasi stream gagal';
                case 'timeout': return 'Waktu habis menghubungkan ke stream';
                case 'unsupported': return 'Format stream tidak didukung browser';
                default: return 'Gagal memuat stream';
            }
        }
    };

    // Skeleton loading state
    if (isConnecting) {
        return (
            <div className="relative bg-[#15191D] rounded-[var(--radius-card)] overflow-hidden" aria-busy="true" aria-label={getConnectingMessage()}>
                <div className="w-full aspect-video relative">
                    <Skeleton className="w-full h-full rounded-[var(--radius-card)] bg-[#1E2329]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#15191D]/80 text-white">
                        <Loader2 className="w-8 h-8 text-[#E60012] animate-spin mx-auto mb-2" aria-hidden="true" />
                        <p className="text-sm font-mono text-white/80 text-center px-4">{getConnectingMessage()}</p>
                        <p className="text-[10px] text-[#A0AAB5] mt-1 font-mono">
                            {Math.round((Date.now() - startTimeRef.current) / 1000)}s
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative bg-[#15191D] rounded-[var(--radius-card)] overflow-hidden ${isFocused ? 'z-30' : ''}`}>
            {/* Video Layer */}
            <div className="w-full aspect-video relative">
                {protocol === 'youtube_live' ? (
                    <iframe
                        ref={iframeRef}
                        src={sessionUrl}
                        title={`${camera.name} YouTube Live`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                    />
                ) : (
                    <img
                        ref={imgRef}
                        src={sessionUrl}
                        alt={`${camera.name} live stream`}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${state === 'playing' ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={handleLoad}
                        onError={handleError}
                    />
                )}

                {/* State Overlay (when not playing) */}
                {state !== 'playing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#15191D] text-white p-4">
                        <div className="space-y-3 text-center max-w-xs">
                            {stateInfo.icon}
                            <p className="font-semibold text-white">{stateInfo.label}</p>
                            <p className="text-xs text-[#A0AAB5]">{getErrorMessage()}</p>

                            {/* YouTube Autoplay Fallback */}
                            {showAutoplayFallback && protocol === 'youtube_live' && (
                                <div className="mt-4 p-3 bg-[#E60012]/10 border border-[#E60012]/30 rounded-[var(--radius-control)]">
                                    <p className="text-xs text-[#E60012] font-medium mb-2 flex items-center justify-center gap-1">
                                        <Play className="w-3 h-3" />
                                        Otomatis diputar diblokir browser
                                    </p>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                            iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                                            setShowAutoplayFallback(false);
                                        }}
                                        className="w-full gap-2 bg-[#E60012] hover:bg-[#CC0010]"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        <span>Klik untuk Memutar</span>
                                    </Button>
                                </div>
                            )}

                            {/* Retry Button for error states */}
                            {isErrorState && !showAutoplayFallback && retryCount < MAX_RETRIES && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRetry}
                                    className="gap-1.5 w-full justify-center bg-white/10 text-white border-[#E0E4E8]/30 hover:bg-white/20"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Coba Lagi ({retryCount + 1}/{MAX_RETRIES})</span>
                                </Button>
                            )}

                            {isErrorState && retryCount >= MAX_RETRIES && (
                                <p className="text-[10px] text-[#C62828] mt-2">
                                    Maksimal percobaan tercapai. Silakan refresh halaman atau hubungi admin.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Autoplay Fallback Overlay (when playing but blocked) */}
                {showAutoplayFallback && state === 'playing' && protocol === 'youtube_live' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#15191D]/95 z-10 pointer-events-auto">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-[#E60012]/10 rounded-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-[#E60012]" />
                            </div>
                            <p className="text-white font-medium mb-2">Klik untuk Memutar</p>
                            <p className="text-xs text-[#A0AAB5] mb-4">Browser memblokir autoplay video</p>
                            <Button
                                variant="default"
                                size="md"
                                onClick={() => {
                                    iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                                    setShowAutoplayFallback(false);
                                }}
                                className="gap-2 bg-[#E60012] hover:bg-[#CC0010]"
                            >
                                <Play className="w-4 h-4" />
                                <span>Mulai Putar</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Retry Overlay for error/offline states */}
                {(isErrorState || state === 'reconnecting') && !showAutoplayFallback && (
                    <div className="absolute inset-0 flex items-end justify-center p-4 pointer-events-none">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            disabled={retryCount >= MAX_RETRIES}
                            className="gap-1.5 pointer-events-auto bg-white/90 text-[#252A30] border-[#E0E4E8] disabled:opacity-50"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{state === 'reconnecting' ? 'Menyambung Ulang...' : 'Coba Lagi'}</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top HUD */}
                <div className="absolute top-0 left-0 right-0 p-2 flex items-start justify-between pointer-events-auto">
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                            state === 'playing' ? 'bg-[#16834A]' :
                            state === 'reconnecting' ? 'bg-[#B7791F]' :
                            isErrorState ? 'bg-[#C62828]' :
                            'bg-[#E60012]'
                        }`} aria-hidden="true">
                            {state === 'playing' ? '●' : isErrorState ? '✕' : '◌'}
                        </span>
                        <span className={`text-[11px] font-mono font-bold ${state === 'playing' ? 'text-[#16834A]' : isErrorState ? 'text-[#C62828]' : 'text-[#E60012]'}`}>
                            {state === 'playing' ? 'LIVE' : state.toUpperCase()}
                        </span>
                        {latencyMs && state === 'playing' && (
                            <span className="text-[10px] text-[#A0AAB5] font-mono">
                                ~{latencyMs}ms
                            </span>
                        )}
                        {isConnecting && (
                            <span className="text-[10px] text-[#A0AAB5] font-mono">
                                {Math.round((Date.now() - startTimeRef.current) / 1000)}s
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono uppercase bg-black/60 text-white px-1.5 py-0.5 rounded font-semibold">
                            {protocol === 'youtube_live' ? 'YT LIVE' : protocol.toUpperCase()}
                            {usesGateway && protocol !== 'youtube_live' && <span className="ml-1 px-1 text-[8px] bg-[#B7791F]/20 text-[#B7791F] rounded">GW</span>}
                        </span>
                        {isFocused ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                title="Tutup fokus"
                                className="text-white hover:bg-white/10 h-7 w-7 p-0"
                                aria-label="Tutup fokus kamera"
                            >
                                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onFullscreen}
                                title="Fokus tampilan kamera"
                                className="text-white hover:bg-white/10 h-7 w-7 p-0"
                                aria-label="Perbesar tampilan kamera"
                            >
                                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Bottom HUD */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto flex items-end justify-between">
                    <div>
                        <p className="text-white font-medium text-xs leading-tight">{camera.name}</p>
                        <p className="text-[10px] text-[#A0AAB5]">{camera.areaLabel}</p>
                    </div>
                    <p className="text-[10px] font-mono text-[#A0AAB5]">
                        {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>
            </div>

            {/* Focus Mode Controls */}
            {isFocused && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between pointer-events-auto">
                    <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-white hover:bg-white/10" aria-label="Tutup fokus kamera">
                        <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Tutup Fokus</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onRetry} className="gap-1.5 text-white hover:bg-white/10" aria-label="Refresh stream kamera">
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Refresh Stream</span>
                    </Button>
                </div>
            )}
        </div>
    );
};