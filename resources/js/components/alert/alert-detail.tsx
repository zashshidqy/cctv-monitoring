import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Clock, MapPin, Wifi, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CameraAlert, HealthCheck } from '@/types';

interface AlertDetailProps {
    alert: CameraAlert & {
        camera?: {
            id: number;
            name: string;
            code: string;
            status: string;
        };
        store?: {
            id: number;
            name: string;
            code: string;
        };
    };
    onClose: () => void;
    onApprove?: () => void;
    onReject?: () => void;
}

export const AlertDetail: React.FC<AlertDetailProps> = ({ alert, onClose, onApprove, onReject }) => {
    const isPending = alert.approval_status === 'pending';
    const isResolved = alert.is_resolved;
    const levelColor = alert.level === 'critical' ? '#E60012' : '#B7791F';
    const bgColor = alert.level === 'critical' ? '#FCE8EA' : '#FEF3C7';

    // Helper to get type label
    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'offline': 'Offline',
            'unstable_connection': 'Koneksi Tidak Stabil',
            'camera_reboot': 'Kamera Reboot',
            'network_issue': 'Masalah Jaringan',
            'camera_offline': 'Kamera Offline',
            'camera_unstable': 'Kamera Tidak Stabil',
        };
        return labels[type] || type;
    };

    // Helper to get type icon
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'offline':
            case 'camera_offline':
                return <Wifi className="w-4 h-4" />;
            case 'unstable_connection':
            case 'camera_unstable':
                return <RefreshCw className="w-4 h-4" />;
            case 'camera_reboot':
                return <AlertTriangle className="w-4 h-4" />;
            case 'network_issue':
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-[#E0E4E8] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isResolved ? 'bg-[#16834A]/20' : `bg-${bgColor}/20`}`}>
                        {getTypeIcon(alert.type)}
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-[#252A30]">Detail Alert</h2>
                        <p className="text-[10px] text-[#68727D]">ID: #{alert.id}</p>
                    </div>
                </div>

                <Button variant="ghost" size="sm" onClick={onClose} className="text-[#68727D] hover:text-[#252A30]">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Alert Status Card */}
                <div className={`p-4 rounded-[var(--radius-card)] border ${isResolved ? 'border-[#16834A]/30 bg-[#ECFDF5]/50' : `border-${levelColor}/30 bg-${bgColor}/10`}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <Badge
                            variant={isResolved ? 'outline' : 'default'}
                            className={`text-xs font-mono px-2 py-1 ${
                                isResolved
                                    ? 'bg-[#16834A]/20 text-[#16834A] border-[#16834A]'
                                    : alert.level === 'critical'
                                    ? 'bg-[#E60012]/20 text-[#E60012] border-[#E60012]'
                                    : 'bg-[#B7791F]/20 text-[#B7791F] border-[#B7791F]'
                            } ${isPending ? 'ring-1 ring-[#E60012]/50' : ''}`}
                        >
                            {isResolved ? 'SELESAI' : isPending ? 'MENUNGGU APPROVAL' : alert.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-[#68727D] border-[#E0E4E8]">
                            {getTypeLabel(alert.type)}
                        </Badge>
                    </div>

                    <p className="text-sm text-[#252A30] mb-3">{alert.summary}</p>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                            <p className="text-[#68727D]">Store</p>
                            <p className="font-mono text-[#E60012] font-semibold">{alert.store?.code}</p>
                        </div>
                        <div>
                            <p className="text-[#68727D]">Kamera</p>
                            <p className="font-mono text-[#252A30]">{alert.camera?.code}</p>
                        </div>
                        <div>
                            <p className="text-[#68727D]">Failure Count</p>
                            <p className="font-mono tabular-nums font-semibold">{alert.failure_count}x</p>
                        </div>
                        <div>
                            <p className="text-[#68727D]">Terakhir Firing</p>
                            <p className="font-mono text-[#252A30]">
                                {new Date(alert.last_fired_at).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div>
                    <h3 className="text-xs font-semibold text-[#68727D] uppercase tracking-wider mb-3">Timeline</h3>
                    <div className="space-y-3 relative pl-4 border-l border-[#E0E4E8]">
                        <div className="relative pb-4">
                            <div className={`absolute -left-[6px] top-0 w-2.5 h-2.5 rounded-full ${isResolved ? 'bg-[#16834A]' : levelColor} border-2 border-white`} />
                            <p className="text-[10px] text-[#A0AAB5] mb-0.5">Alert Dibuat</p>
                            <p className="text-sm font-medium text-[#252A30]">
                                {new Date(alert.first_fired_at).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>

                        {alert.failure_count > 1 && (
                            <div className="relative pb-4">
                                <div className="absolute -left-[6px] top-0 w-2.5 h-2.5 rounded-full bg-[#B7791F] border-2 border-white" />
                                <p className="text-[10px] text-[#A0AAB5] mb-0.5">Failure Terulang ({alert.failure_count}x)</p>
                                <p className="text-sm font-medium text-[#252A30]">
                                    {new Date(alert.last_fired_at).toLocaleString('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        )}

                        {isPending && (
                            <div className="relative pb-4">
                                <div className="absolute -left-[6px] top-0 w-2.5 h-2.5 rounded-full bg-[#E60012] border-2 border-white animate-pulse" />
                                <p className="text-[10px] text-[#E60012] font-medium mb-0.5">Menunggu Approval</p>
                                <p className="text-sm text-[#68727D]">Memerlukan persetujuan GM/SV untuk tindakan lanjut</p>
                            </div>
                        )}

                        {isResolved && alert.recovered_at && (
                            <div className="relative">
                                <div className="absolute -left-[6px] top-0 w-2.5 h-2.5 rounded-full bg-[#16834A] border-2 border-white" />
                                <p className="text-[10px] text-[#16834A] font-medium mb-0.5">Pulih (Resolved)</p>
                                <p className="text-sm font-medium text-[#16834A]">
                                    {new Date(alert.recovered_at).toLocaleString('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Camera & Store Info */}
                <div className="grid grid-cols-2 gap-3">
                    {alert.camera && (
                        <div className="p-3 bg-[#15191D]/50 rounded-[var(--radius-card)] border border-[#252A30]/20">
                            <div className="flex items-center gap-2 mb-2">
                                <ExternalLink className="w-4 h-4 text-[#E60012]" />
                                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Kamera</h4>
                            </div>
                            <div className="space-y-1 text-[11px]">
                                <div className="flex justify-between">
                                    <span className="text-[#A0AAB5]">Nama</span>
                                    <span className="text-white font-medium">{alert.camera.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#A0AAB5]">Kode</span>
                                    <span className="text-white font-mono">{alert.camera.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#A0AAB5]">Status</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] ${
                                            alert.camera.status === 'online' ? 'bg-[#16834A]/20 text-[#16834A] border-[#16834A]' :
                                            alert.camera.status === 'unstable' ? 'bg-[#B7791F]/20 text-[#B7791F] border-[#B7791F]' :
                                            'bg-[#C62828]/20 text-[#C62828] border-[#C62828]'
                                        }`}
                                    >
                                        {alert.camera.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    {alert.store && (
                        <div className="p-3 bg-[#15191D]/50 rounded-[var(--radius-card)] border border-[#252A30]/20">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-[#E60012]" />
                                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Store</h4>
                            </div>
                            <div className="space-y-1 text-[11px]">
                                <div className="flex justify-between">
                                    <span className="text-[#A0AAB5]">Nama</span>
                                    <span className="text-white font-medium">{alert.store.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#A0AAB5]">Kode</span>
                                    <span className="text-white font-mono text-[#E60012]">{alert.store.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#A0AAB5]">ID</span>
                                    <span className="text-white font-mono">#{alert.store.id}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Health History */}
                {/* Note: Health history would be passed separately in a real implementation */}

                {/* Approval Actions */}
                {isPending && onApprove && onReject && (
                    <div className="pt-4 border-t border-[#E0E4E8]">
                        <p className="text-xs font-semibold text-[#E60012] mb-3">Perlu Tindakan: Approval Alert</p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onApprove}
                                className="flex-1 gap-2 bg-[#16834A]/10 border-[#16834A] text-[#16834A] hover:bg-[#16834A]/20"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Setuju & Tindak Lanjuti
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onReject}
                                className="flex-1 gap-2 bg-[#E60012]/10 border-[#E60012] text-[#E60012] hover:bg-[#E60012]/20"
                            >
                                <XCircle className="w-4 h-4" />
                                Tolak Alert
                            </Button>
                        </div>
                    </div>
                )}

                {isResolved && (
                    <div className="pt-4 border-t border-[#E0E4E8]">
                        <div className="flex items-center gap-2 p-3 bg-[#ECFDF5] rounded-[var(--radius-card)] border border-[#16834A]/30">
                            <CheckCircle2 className="w-5 h-5 text-[#16834A]" />
                            <p className="text-sm text-[#16834A] font-medium">
                                Alert ini telah diselesaikan secara otomatis saat kamera pulih.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};