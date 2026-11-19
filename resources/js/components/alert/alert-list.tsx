import React, { useMemo } from 'react';
import { AlertTriangle, Loader2, Inbox } from 'lucide-react';
import { AlertListItem } from './alert-list-item';
import { Button } from '@/components/ui/button';
import { CameraAlert as AlertType } from '@/types';

interface AlertListProps {
    alerts: AlertType[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onAlertClick: (alert: AlertType) => void;
    sortBy?: 'new' | 'active' | 'resolved' | 'date';
}

export const AlertList: React.FC<AlertListProps> = ({
    alerts,
    loading,
    error,
    onRetry,
    onAlertClick,
    sortBy = 'date',
}) => {
    // Group alerts by store or type
    const groupedAlerts = useMemo(() => {
        const groups: Record<string, typeof alerts> = {};

        alerts.forEach((alert) => {
            const key = alert.store?.code || 'unknown';
            if (! groups[key]) {
                groups[key] = [];
            }
            groups[key].push(alert);
        });

        return groups;
    }, [alerts]);

    const pendingApprovals = alerts.filter((a) => a.approval_status === 'pending');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Loader2 className="w-8 h-8 text-[#E60012] animate-spin" />
                <p className="text-sm text-[#A0AAB5]">Memuat alert...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <AlertTriangle className="w-8 h-8 text-[#C62828]" />
                <p className="text-sm text-[#A0AAB5]">{error}</p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                    Retry
                </Button>
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Inbox className="w-12 h-12 text-[#E60012]/20" />
                <p className="text-sm text-[#A0AAB5]">Tidak ada alert aktif</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Pending Approvals Banner */}
            {pendingApprovals.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-[#FCE8EA] border border-[#E60012]/30 rounded-[var(--radius-panel)]">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#E60012] animate-pulse" />
                        <p className="text-sm font-semibold text-[#E60012]">
                            {pendingApprovals.length} Alert menunggu persetujuan GM/SV
                        </p>
                    </div>
                    <Button variant="default" size="sm" className="text-white bg-[#E60012] hover:bg-[#C60012]">
                        Lihat Alert
                    </Button>
                </div>
            )}

            {/* Alert Count Summary */}
            <div className="flex items-center justify-between text-xs">
                <p className="text-[#68727D]">
                    {alerts.length} Alert ditemukan (dikelompokkan per store)
                </p>
                <div className="flex gap-3 text-[10px] font-mono">
                    <span className="text-[#E60012]">{alerts.filter((a) => !a.is_resolved).length} aktif</span>
                    <span className="text-[#16834A]">{alerts.filter((a) => a.is_resolved).length} diresolve</span>
                </div>
            </div>

            {/* Alert Groups */}
            {Object.entries(groupedAlerts).map(([storeCode, storeAlerts]) => (
                <div key={storeCode}>
                    <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-semibold text-[#252A30]">{storeCode}</p>
                        <Badge variant="secondary" className="text-[10px] bg-[#EEF0F2]">
                            {storeAlerts.length}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        {storeAlerts.map((alert) => (
                            <AlertListItem
                                key={alert.id}
                                alert={alert}
                                onClick={() => onAlertClick(alert)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};