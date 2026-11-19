import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { Search, FileText, User, Calendar, ShieldCheck, Eye, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface LogItem {
    id: number;
    action: string;
    actor: {
        id: number;
        name: string;
        email: string;
    } | null;
    subjectType: string | null;
    subjectId: number | null;
    metadata: Record<string, any> | null;
    occurredAt: string;
}

interface ActivityLogsProps {
    logs: {
        data: LogItem[];
        links: any[];
        total: number;
    };
    filters: {
        action: string;
    };
}

export default function ActivityLogsIndex({ logs, filters }: ActivityLogsProps) {
    const [actionFilter, setActionFilter] = useState(filters.action || '');
    const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/activity-logs', { action: actionFilter }, { preserveState: true });
    };

    return (
        <AdminLayout title="Audit Log (Catatan Aktivitas)">
            <Head title="Audit Log — O!Save Monitor" />

            <div className="space-y-5 max-w-6xl">
                {/* Filter Bar */}
                <div className="flex items-center justify-between gap-3 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-4 shadow-[var(--shadow-raised)]">
                    <form onSubmit={handleSearch} className="flex-1 max-w-sm">
                        <div className="relative">
                            <Search className="w-4 h-4 text-[#68727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                placeholder="Filter aksi (contoh: user.created)..."
                                className="w-full h-8 pl-9 pr-3 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                            />
                        </div>
                    </form>

                    <div className="text-xs text-[#68727D]">
                        Total Catatan: <strong className="text-[#252A30]">{logs.total}</strong>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#EEF0F2] text-[#68727D] uppercase text-[10px]">
                                <tr>
                                    <th className="p-3">Waktu & Tanggal</th>
                                    <th className="p-3">Aksi (Action)</th>
                                    <th className="p-3">Aktor (Pengguna)</th>
                                    <th className="p-3">Objek / Subjek</th>
                                    <th className="p-3 text-right">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0E4E8] text-[#252A30]">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-[#68727D]">
                                            Belum ada catatan aktivitas yang tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                                            <td className="p-3 font-mono text-[11px] text-[#68727D] whitespace-nowrap">
                                                {formatDateTime(log.occurredAt)}
                                            </td>
                                            <td className="p-3">
                                                <code className="text-[11px] font-semibold text-[#252A30] bg-[#EEF0F2] px-2 py-0.5 rounded">
                                                    {log.action}
                                                </code>
                                            </td>
                                            <td className="p-3">
                                                {log.actor ? (
                                                    <div>
                                                        <p className="font-medium text-[#252A30]">{log.actor.name}</p>
                                                        <p className="text-[10px] text-[#68727D]">{log.actor.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[#68727D] italic">Sistem / Otomatis</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-[11px] text-[#68727D]">
                                                {log.subjectType ? `${log.subjectType} #${log.subjectId}` : '-'}
                                            </td>
                                            <td className="p-3 text-right">
                                                {log.metadata && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedLog(log)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-[var(--radius-control)] border border-[#E0E4E8] hover:bg-[#EEF0F2] text-[#252A30] transition-colors"
                                                    >
                                                        <Eye className="w-3 h-3 text-[#68727D]" />
                                                        <span>Lihat</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Metadata Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="p-4 border-b border-[#E0E4E8] flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-[#252A30]">
                                    Detail Metadata: {selectedLog.action}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setSelectedLog(null)}
                                    className="p-1 rounded-md text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2]"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-4 bg-[#15191D] text-[#E0E4E8] overflow-x-auto text-xs font-mono">
                                <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                            </div>

                            <div className="p-3 bg-[#F4F5F6] border-t border-[#E0E4E8] text-[11px] text-[#68727D] flex justify-between items-center">
                                <span>Nilai kredensial & rahasia disunting otomatis (REDACTED).</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedLog(null)}
                                    className="px-2.5 py-1 text-xs font-medium text-[#252A30] bg-white border border-[#E0E4E8] rounded-[var(--radius-control)]"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
