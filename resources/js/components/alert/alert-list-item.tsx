import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CameraAlert as AlertType } from '@/types';

interface AlertListItemProps {
    alert: AlertType;
    onClick: () => void;
}

export const AlertListItem: React.FC<AlertListItemProps> = ({ alert, onClick }) => {
    const isPending = alert.approval_status === 'pending';
    const levelClass = alert.level === 'critical' ? 'border-[#E60012]' : 'border-[#E60012]';
    const bgColorClass = alert.level === 'critical' ? 'bg-[#FCE8EA]/10' : 'bg-[#FEF3C7]/10';

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-[var(--radius-panel)] border ${levelClass} hover:border-[#E60012]/80 ${bgColorClass} transition-all ${isPending ? 'ring-1 ring-[#E60012]/50' : ''}`}
        >
            <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#252A30]">{alert.summary}</h4>
                </div>
                <Badge
                    variant={alert.is_resolved ? 'outline' : 'default'}
                    className={`text-[10px] font-mono px-1.5 py-0.5 ${
                        alert.level === 'critical'
                            ? 'bg-[#E60012]/20 text-[#E60012] border-[#E60012]'
                            : 'bg-[#B7791F]/20 text-[#B7791F] border-[#B7791F]'
                    } ${alert.is_resolved ? 'bg-[#16834A]/20 text-[#16834A] border-[#16834A]' : ''}`}
                >
                    {alert.is_resolved ? 'RESOLVED' : alert.level.toUpperCase()}
                </Badge>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#68727D] mb-2">
                <span className="flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    {alert.camera?.code || 'Unknown'}
                </span>
                <span>•</span>
                <span>{alert.store?.code}</span>
                <span>•</span>
                <span className="font-mono">
                    {new Date(alert.last_fired_at).toLocaleDateString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
                {isPending && (
                    <>
                        <span>•</span>
                        <span className="text-[#E60012] font-semibold">PENDING</span>
                    </>
                )}
            </div>

            {/* Approval Request Banner for Pending */}
            {isPending && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-[#E60012]/5 rounded border border-[#E60012]/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E60012]" />
                    <p className="text-[11px] text-[#E60012] font-medium">
                        Action required: GM/SV harus menyetujui penanganan alert ini.
                    </p>
                </div>
            )}
        </button>
    );
};

import { Camera, AlertTriangle } from 'lucide-react';