import React, { useState, useEffect, useCallback } from 'react';
import { AlertBellNotification, AlertListItem } from './alert-list-item';
import { AlertDetail } from './alert-detail';
import { AlertList } from './alert-list';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, X } from 'lucide-react';

interface CameraAlert {
    id: number;
    level: 'warning' | 'critical';
    camera?: {
        id: number;
        code: string;
        name: string;
        store_id: number;
    };
    store?: {
        id: number;
        name: string;
        code: string;
    };
    summary: string;
    failure_count: number;
    last_fired_at: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    is_resolved: boolean;
}

interface AlertBellProps {
    alerts: CameraAlert[];
    loading: boolean;
    storing: string | null;
    alertDetailId: number | null;
    onAlertClick: (alertId: number) => void;
    onAlertDetailClose: () => void;
    onAlertApprove: (alertId: number) => Promise<void>;
    onAlertReject: (alertId: number) => Promise<void>;
    onNavigateToAlerts: () => void;
}

export const AlertBell: React.FC<AlertBellProps> = ({
    alerts,
    loading,
    storeFilter,
    alertDetailId,
    onAlertClick,
    onAlertDetailClose,
    onAlertApprove,
    onAlertReject,
    onNavigateToAlerts,
}) => {
    const showAlertDetail = alertDetailId !== null;

    return (
        <>
            {/* Alert Button in Header */}
            <AlertBellNotification
                alertCount={alerts.filter((a) => !a.is_resolved).length}
                onNavigate={onNavigateToAlerts}
            />

            {/* Alert List Modal/Drawer */}
            {storeFilter || showAlertDetail ? (
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    {showAlertDetail ? (
                        <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-[var(--radius-panel)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {/* Header */}
                            <div className="p-4 border-b border-[#E0E4E8] flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-[#252A30]">
                                    Detail Alert
                                </h2>
                                <Button variant="ghost" size="sm" onClick={onAlertDetailClose}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto h-full">
                                {/* Render AlertDetail */}
                                {/* Placeholder for now - would integrate AlertDetail component */}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-4xl max-h-[85vh] bg-white rounded-[var(--radius-panel)] shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="p-4 border-b border-[#E0E4E8] bg-[#F4F5F6]/60 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-[#E60012]" />
                                    <h2 className="text-sm font-semibold text-[#252A30]">
                                        Center
                                    </h2>
                                    <span className="text-xs text-[#68727D]">
                                        {alerts.length} Alert
                                    </span>
                                </div>

                                {storeFilter && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onNavigateToAlerts}
                                    >
                                        <X className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Close</span>
                                    </Button>
                                )}
                            </div>

                            {/* Alerts List */}
                            <div className="p-4 h-[70vh] overflow-y-auto">
                                <div className="space-y-2">
                                    <div className="w-full h-64 flex items-center justify-center text-[#A0AAB5]">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="ml-2 text-sm">Memuat alert...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </>
    );
};