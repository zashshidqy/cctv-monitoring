import React from 'react';
import { X, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { CameraAlert as AlertType } from '@/types';

interface AlertDetailProps {
    alert: AlertType;
    healthHistory: Array<{
        id: number;
        result: string;
        latency_ms: number | null;
        probed_at: string;
    }>;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
    loading?: boolean;
}

export const AlertDetail: React.FC<AlertDetailProps> = ({
    alert,
    healthHistory,
    onClose,
    onApprove,
    onReject,
    loading = false,
}) => {
    const isPending = alert.approval_status === 'pending';
    const canApprove = isPending;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="p-4 border-b border-[#E0E4E8] flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${alert.level === 'critical' ? 'bg-[#E60012]' : 'bg-[#B7791F]'}`} />
                            <h3 className="text-sm font-semibold text-[#252A30]">{alert.summary}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#68727D]">
                            <span className="font-mono">{alert.camera?.code}</span>
                            <span>•</span>
                            <span>{alert.store?.name} ({alert.store?.code})</span>
                            <span>•</span>
                            <span className="font-mono">
                                {new Date(alert.first_fired_at).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto space-y-4">
                    {/* Status Indicators */}
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={alert.is_resolved ? 'online' : alert.level} />
                        <Badge variant={alert.is_resolved ? 'default' : 'outline'} className="text-[10px]">
                            {alert.is_resolved ? 'Resolved' : 'Active'}
                        </Badge>
                        <Badge variant={alert.type === 'offline' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {alert.type.replace('_', ' ')}
                        </Badge>
                        {isPending && (
                            <Badge variant="secondary" className="text-[10px] bg-[#FCE8EA] text-[#E60012]">
                                Pending Approval
                            </Badge>
                        )}
                        {alert.approval_status === 'approved' && (
                            <Badge variant="secondary" className="text-[10px] bg-[#DCFCE7] text-[#16834A]">
                                Approved
                            </Badge>
                        )}
                        {alert.approval_status === 'rejected' && (
                            <Badge variant="secondary" className="text-[10px] bg-[#FEE2E2] text-[#C62828]">
                                Rejected
                            </Badge>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-[#EEF0F2] p-3 rounded-[var(--radius-control)]">
                        <div>
                            <p className="text-[#68727D]">Failure Count</p>
                            <p className="font-mono font-semibold text-[#252A30]">{alert.failure_count}x</p>
                        </div>
                        <div>
                            <p className="text-[#68727D]">First Fired</p>
                            <p className="font-mono text-[#252A30]">
                                {new Date(alert.first_fired_at).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="text-[#68727D]">Last Fired</p>
                            <p className="font-mono text-[#252A30]">
                                {new Date(alert.last_fired_at).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="text-[#68727D]">{alert.is_resolved ? 'Resolved At' : 'Still Active'}</p>
                            <p className="font-mono text-[#252A30]">
                                {alert.recovered_at
                                    ? new Date(alert.recovered_at).toLocaleString('id-ID')
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Approval Actions */}
                    {isPending && (
                        <div className="p-3 bg-[#FCE8EA] border border-[#E60012]/30 rounded-[var(--radius-panel)]">
                            <p className="text-sm font-semibold text-[#E60012] mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Action Required: Alert ini memerlukan persetujuan GM/SV
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={onApprove}
                                    loading={loading}
                                    className="gap-1.5 flex-1"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Setujui</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onReject}
                                    loading={loading}
                                    className="gap-1.5 flex-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Tolak</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Health History Timeline */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#68727D] mb-2">
                            Riwayat Health Check (10 terbaru)
                        </h4>
                        <div className="space-y-1.5">
                            {healthHistory.length > 0 ? (
                                healthHistory.map((check) => (
                                    <div
                                        key={check.id}
                                        className={`flex items-center gap-2 p-2 rounded-[var(--radius-control)] text-xs ${
                                            check.result === 'success'
                                                ? 'bg-[#DCFCE7] text-[#16834A]'
                                                : 'bg-[#FEE2E2] text-[#C62828]'
                                        }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
                                        <span className="font-mono flex-1">
                                            {new Date(check.probed_at).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            })}
                                        </span>
                                        <span className="font-mono capitalize">{check.result}</span>
                                        {check.latency_ms && (
                                            <span className="text-[#A0AAB5]">
                                                ~{check.latency_ms}ms
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-[11px] text-[#A0AAB5] text-center py-4">
                                    Tidak ada riwayat health check untuk kamera ini
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { Badge } from '@/components/ui/badge';