import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertListItem } from './alert-list-item';
import { AlertDetail } from './alert-detail';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, X, Filter, BellRing, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { CameraAlert, AlertSummary } from '@/types';
import type { AlertDetailProps } from './alert-detail';

interface AlertBellProps {
    userRole: 'master_admin' | 'gm' | 'sv' | 'staff';
    onNavigateToStore?: (storeId: number) => void;
    onNavigateToAlertsPage?: () => void;
}

type FilterTab = 'all' | 'unread' | 'pending' | 'resolved';

export const AlertBell: React.FC<AlertBellProps> = ({
    userRole,
    onNavigateToStore,
    onNavigateToAlertsPage,
}) => {
    const [alerts, setAlerts] = useState<CameraAlert[]>([]);
    const [summary, setSummary] = useState<AlertSummary>({ new: 0, active: 0, resolved: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('unread');
    const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'info' | 'warning' | 'critical' } | null>(null);

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const seenAlertIdsRef = useRef<Set<number>>(new Set());

    // Fetch alerts from API
    const fetchAlerts = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (activeFilter !== 'all') {
                params.set('status', activeFilter);
            }
            params.set('per_page', '50');

            const res = await fetch(`/alerts?${params.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            if (res.ok) {
                const data = await res.json();
                const fetchedAlerts: CameraAlert[] = data.alerts?.data || data.alerts || [];
                setAlerts(fetchedAlerts);
                setSummary(data.summary || { new: 0, active: 0, resolved: 0, total: 0 });

                // Check for new alerts to show toast
                const currentAlertIds = new Set<number>(fetchedAlerts.map((a: CameraAlert) => a.id));
                const newAlertIds = [...currentAlertIds].filter((id: number) => !seenAlertIdsRef.current.has(id));

                if (newAlertIds.length > 0 && seenAlertIdsRef.current.size > 0) {
                    const newAlerts = fetchedAlerts.filter((a: CameraAlert) => newAlertIds.includes(a.id));
                    newAlerts.forEach((alert: CameraAlert) => {
                        showToast(alert);
                    });
                }

                // Update seen alerts
                seenAlertIdsRef.current = currentAlertIds;
                setLastFetchTime(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setLoading(false);
        }
    }, [activeFilter]);

    // Show toast notification for new alert
    const showToast = (alert: CameraAlert) => {
        const level = alert.level;
        setToast({
            message: `${alert.store?.code}: ${alert.summary}`,
            type: level,
        });

        // Auto-dismiss toast after 5 seconds
        setTimeout(() => setToast(null), 5000);
    };

    // Start polling
    useEffect(() => {
        fetchAlerts(); // Initial fetch
        pollingIntervalRef.current = setInterval(fetchAlerts, 30000); // 30 second polling

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [fetchAlerts]);

    // Handle alert click - show detail and deep-link
    const handleAlertClick = (alert: CameraAlert) => {
        setSelectedAlertId(alert.id);
        setIsOpen(true);

        // If alert has a store and we have navigation handler, navigate to store on map
        if (alert.store?.id && onNavigateToStore) {
            onNavigateToStore(alert.store.id);
        }
    };

    // Handle approve/reject
    const handleApprove = async (alertId: number) => {
        try {
            const res = await fetch(`/alerts/${alertId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            if (res.ok) {
                setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, approval_status: 'approved' as const } : a));
                fetchAlerts();
            }
        } catch (err) {
            console.error('Failed to approve alert:', err);
        }
    };

    const handleReject = async (alertId: number) => {
        try {
            const res = await fetch(`/alerts/${alertId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            if (res.ok) {
                setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, approval_status: 'rejected' as const } : a));
                fetchAlerts();
            }
        } catch (err) {
            console.error('Failed to reject alert:', err);
        }
    };

    // Get filtered alerts based on active tab
    const filteredAlerts = alerts.filter(alert => {
        switch (activeFilter) {
            case 'unread':
                return !alert.is_resolved && (alert.approval_status === 'pending' || alert.approval_status === 'approved');
            case 'pending':
                return alert.approval_status === 'pending';
            case 'resolved':
                return alert.is_resolved;
            default:
                return true;
        }
    });

    // Calculate unread count for badge
    const unreadCount = alerts.filter(a => !a.is_resolved && a.approval_status !== 'rejected').length;

    const canApprove = ['master_admin', 'gm', 'sv'].includes(userRole);

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-right duration-200" role="alert">
                    <div className={`bg-white border rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] p-4 max-w-sm ${
                        toast.type === 'critical' ? 'border-l-4 border-[#E60012]' :
                        toast.type === 'warning' ? 'border-l-4 border-[#B7791F]' :
                        'border-l-4 border-[#16834A]'
                    }`}>
                        <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full ${
                                toast.type === 'critical' ? 'bg-[#E60012]' :
                                toast.type === 'warning' ? 'bg-[#B7791F]' :
                                'bg-[#16834A]'
                            }`} />
                            <p className="text-sm text-[#252A30] mt-0.5">{toast.message}</p>
                            <button onClick={() => setToast(null)} className="ml-auto text-[#A0AAB5] hover:text-[#252A30]">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Bell Button in Header */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchAlerts(); }}
                    className={`relative p-2 rounded-[var(--radius-control)] transition-colors ${
                        unreadCount > 0
                            ? 'bg-[#FCE8EA] text-[#E60012]'
                            : 'text-[#68727D] hover:bg-[#EEF0F2] hover:text-[#252A30]'
                    }`}
                    aria-label={`Notifikasi Alert (${unreadCount} baru)`}
                    aria-expanded={isOpen}
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60012] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown/Drawer */}
                {isOpen && (
                    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                        <div className="absolute right-4 top-14 w-full max-w-md max-h-[80vh] bg-white rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-4 border-b border-[#E0E4E8] bg-[#F4F5F6]/60 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-[#E60012]" />
                                    <h2 className="text-sm font-semibold text-[#252A30]">
                                        Notifikasi Alert
                                    </h2>
                                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${unreadCount > 0 ? 'bg-[#E60012]/20 text-[#E60012]' : 'bg-[#16834A]/20 text-[#16834A]'}`}>
                                        {unreadCount} Baru
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => { setIsOpen(false); onNavigateToAlertsPage?.(); }}>
                                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Halaman Alert</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="p-3 border-b border-[#E0E4E8] bg-white flex gap-1 overflow-x-auto">
                                {([
                                    { key: 'unread', label: 'Belum Dibaca', count: alerts.filter(a => !a.is_resolved && a.approval_status !== 'rejected').length },
                                    { key: 'pending', label: 'Menunggu Approval', count: alerts.filter(a => a.approval_status === 'pending').length },
                                    { key: 'all', label: 'Semua', count: alerts.length },
                                    { key: 'resolved', label: 'Selesai', count: alerts.filter(a => a.is_resolved).length },
                                ] as const).map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => { setActiveFilter(tab.key as FilterTab); fetchAlerts(); }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === tab.key ? 'bg-[#E60012] text-white' : 'text-[#68727D] hover:bg-[#EEF0F2] hover:text-[#252A30]'}`}
                                    >
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${activeFilter === tab.key ? 'bg-white/30 text-white' : 'bg-[#EEF0F2] text-[#68727D]'}`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Alerts List */}
                            <div className="max-h-[60vh] overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 flex flex-col items-center justify-center text-[#A0AAB5]">
                                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                        <span className="text-sm">Memuat alert...</span>
                                    </div>
                                ) : filteredAlerts.length === 0 ? (
                                    <div className="p-8 flex flex-col items-center justify-center text-[#A0AAB5]">
                                        <BellRing className="w-10 h-10 text-[#E0E4E8] mb-2" />
                                        <p className="text-sm font-medium text-[#68727D]">Tidak ada alert</p>
                                        <p className="text-xs text-[#A0AAB5]">Semua sistem berjalan normal</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#E0E4E8]">
                                        {filteredAlerts.map(alert => (
                                            <AlertListItem
                                                key={alert.id}
                                                alert={alert}
                                                onClick={() => handleAlertClick(alert)}
                                                onApprove={canApprove ? () => handleApprove(alert.id) : undefined}
                                                onReject={canApprove ? () => handleReject(alert.id) : undefined}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-3 border-t border-[#E0E4E8] bg-[#F4F5F6]/60 flex items-center justify-between text-[11px] text-[#68727D]">
                                <span>Terakhir diperbarui: {lastFetchTime ? lastFetchTime.toLocaleTimeString('id-ID') : 'Baru saja'}</span>
                                <Button variant="ghost" size="sm" onClick={fetchAlerts}>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Alert Detail Modal */}
            {selectedAlertId && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedAlertId(null)}>
                    <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-[var(--radius-panel)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
                        <AlertDetail
                            alert={alerts.find(a => a.id === selectedAlertId)! as AlertDetailProps['alert']}
                            onClose={() => setSelectedAlertId(null)}
                            onApprove={canApprove ? () => handleApprove(selectedAlertId!) : undefined}
                            onReject={canApprove ? () => handleReject(selectedAlertId!) : undefined}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export interface UnreadCountResponse {
    count: number;
    new: number;
    active: number;
}