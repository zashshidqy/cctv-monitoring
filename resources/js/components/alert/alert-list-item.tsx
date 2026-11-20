import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CameraAlert } from '@/types';

interface AlertListItemProps {
    alert: CameraAlert;
    onClick: () => void;
    onApprove?: () => void;
    onReject?: () => void;
}

export const AlertListItem: React.FC<AlertListItemProps> = ({ alert, onClick, onApprove, onReject }) => {
    const isPending = alert.approval_status === 'pending';
    const isResolved = alert.is_resolved;
    const levelColor = alert.level === 'critical' ? '#E60012' : '#B7791F';
    const bgColor = alert.level === 'critical' ? '#FCE8EA' : '#FEF3C7';

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-[var(--radius-panel)] border hover:border-[#E60012]/80 transition-all ${isPending ? 'ring-1 ring-[#E60012]/50' : ''} ${
                isResolved ? 'bg-[#ECFDF5]/50' : `bg-${bgColor}/10`
            } border-${levelColor}/30`}
        >
            <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#252A30] truncate pr-2">{alert.summary}</h4>
                </div>
                <Badge
                    variant={isResolved ? 'outline' : 'default'}
                    className={`text-[10px] font-mono px-1.5 py-0.5 ${
                        isResolved
                            ? 'bg-[#16834A]/20 text-[#16834A] border-[#16834A]'
                            : alert.level === 'critical'
                            ? 'bg-[#E60012]/20 text-[#E60012] border-[#E60012]'
                            : 'bg-[#B7791F]/20 text-[#B7791F] border-[#B7791F]'
                    } ${isPending ? 'ring-1 ring-[#E60012]/50' : ''}`}
                >
                    {isResolved ? 'SELESAI' : isPending ? 'PENDING' : alert.level.toUpperCase()}
                </Badge>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#68727D] mb-2 flex-wrap">
                {alert.camera && (
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-[#E60012]/10 flex items-center justify-center">
                            <ExternalLink className="w-2.5 h-2.5 text-[#E60012]" />
                        </span>
                        {alert.camera.code}
                    </span>
                )}
                <span>•</span>
                {alert.store && (
                    <span className="font-mono text-[#E60012]">{alert.store.code}</span>
                )}
                <span>•</span>
                <span className="font-mono">
                    {new Date(alert.last_fired_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>

            {/* Approval Request Banner for Pending */}
            {isPending && canApprove && onApprove && onReject && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-[#E60012]/5 rounded border border-[#E60012]/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E60012]" />
                    <p className="text-[11px] text-[#E60012] font-medium flex-1">
                        Tindakan diperlukan: {alert.level === 'critical' ? 'GM/SV harus menyetujui penanganan kritis ini.' : 'Perlu review dan approval untuk follow-up.'}
                    </p>
                    <div className="flex gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onApprove(); }}
                            className="gap-1 text-[10px] h-6 text-[#16834A] border-[#16834A] hover:bg-[#16834A]/10"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            Setuju
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onReject(); }}
                            className="gap-1 text-[10px] h-6 text-[#E60012] border-[#E60012] hover:bg-[#E60012]/10"
                        >
                            <XCircle className="w-3 h-3" />
                            Tolak
                        </Button>
                    </div>
                </div>
            )}

            {/* Resolved indicator */}
            {isResolved && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-[#16834A]/5 rounded border border-[#16834A]/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16834A]" />
                    <p className="text-[11px] text-[#16834A] font-medium">
                        Alert ini telah diselesaikan
                        {alert.recovered_at && ` pada ${new Date(alert.recovered_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                </div>
            )}
        </button>
    );
};

// Helper to check if current user can approve (passed via props in real usage)
const canApprove = true; // This will be controlled by parent component passing onApprove/onReject