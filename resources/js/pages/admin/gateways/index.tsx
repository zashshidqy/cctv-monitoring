import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Network,
    Server,
    Activity,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Edit3,
    Trash2,
    X,
    RefreshCw,
    Store as StoreIcon,
    Cpu,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import type { GatewayItem, GatewayStatus, GatewayType } from '@/types';

interface StoreOption {
    id: number;
    code: string;
    name: string;
    city: string;
}

interface GatewaysIndexProps {
    gateways: {
        data: GatewayItem[];
        links: any[];
        total: number;
    };
    stores: StoreOption[];
    filters: {
        search: string;
        type: string;
        status: string;
        store_id: string;
    };
    stats: {
        total: number;
        online: number;
        offline: number;
        degraded: number;
    };
}

export default function GatewaysIndex({
    gateways,
    stores,
    filters,
    stats,
}: GatewaysIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [storeFilter, setStoreFilter] = useState(filters.store_id || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGateway, setEditingGateway] = useState<GatewayItem | null>(null);
    const [pingingId, setPingingId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '',
        name: '',
        type: 'edge' as GatewayType,
        store_id: '' as string | number,
        host: '',
        port: 8554,
        status: 'online' as GatewayStatus,
        version: 'v1.4.2',
        notes: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/gateways',
            {
                search,
                type: typeFilter,
                status: statusFilter,
                store_id: storeFilter,
            },
            { preserveState: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const nextFilters = {
            search,
            type: typeFilter,
            status: statusFilter,
            store_id: storeFilter,
            [key]: value,
        };

        if (key === 'type') setTypeFilter(value);
        if (key === 'status') setStatusFilter(value);
        if (key === 'store_id') setStoreFilter(value);

        router.get('/admin/gateways', nextFilters, { preserveState: true });
    };

    const openCreateModal = () => {
        reset();
        setEditingGateway(null);
        setIsModalOpen(true);
    };

    const openEditModal = (gw: GatewayItem) => {
        setEditingGateway(gw);
        setData({
            code: gw.code,
            name: gw.name,
            type: gw.type,
            store_id: gw.storeId || '',
            host: gw.host || '',
            port: gw.port || 8554,
            status: gw.status,
            version: gw.version || '',
            notes: gw.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingGateway) {
            put(`/admin/gateways/${editingGateway.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingGateway(null);
                },
            });
        } else {
            post('/admin/gateways', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (gw: GatewayItem) => {
        if (
            confirm(
                `Yakin ingin menghapus Media Gateway ${gw.name} (${gw.code})? Sesi kamera yang terhubung ke gateway ini mungkin akan terputus.`
            )
        ) {
            router.delete(`/admin/gateways/${gw.id}`);
        }
    };

    const handlePing = async (gw: GatewayItem) => {
        setPingingId(gw.id);
        try {
            await router.post(`/admin/gateways/${gw.id}/ping`, {}, {
                preserveScroll: true,
                preserveState: true,
            });
        } finally {
            setPingingId(null);
        }
    };

    const getStatusBadge = (status: GatewayStatus) => {
        switch (status) {
            case 'online':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E6F4EA] text-[#16834A]">
                        <CheckCircle2 className="w-3 h-3" />
                        Online
                    </span>
                );
            case 'degraded':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3D6] text-[#B7791F]">
                        <AlertTriangle className="w-3 h-3" />
                        Degraded
                    </span>
                );
            case 'offline':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FCE8EA] text-[#C62828]">
                        <XCircle className="w-3 h-3" />
                        Offline
                    </span>
                );
        }
    };

    return (
        <AdminLayout title="Manajemen Gateway">
            <Head title="Manajemen Gateway — O!Save Monitor" />

            <div className="space-y-5 max-w-6xl">
                {/* KPI Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-3.5 shadow-[var(--shadow-raised)]">
                        <div className="flex items-center justify-between text-[#68727D] mb-1">
                            <span className="text-xs font-medium">Total Gateway</span>
                            <Server className="w-4 h-4" />
                        </div>
                        <div className="text-2xl font-bold text-[#252A30]">{stats.total}</div>
                        <div className="text-[11px] text-[#68727D] mt-0.5">Node terdaftar</div>
                    </div>

                    <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-3.5 shadow-[var(--shadow-raised)]">
                        <div className="flex items-center justify-between text-[#16834A] mb-1">
                            <span className="text-xs font-medium">Gateway Online</span>
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="text-2xl font-bold text-[#16834A]">{stats.online}</div>
                        <div className="text-[11px] text-[#68727D] mt-0.5">Responsif & aktif</div>
                    </div>

                    <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-3.5 shadow-[var(--shadow-raised)]">
                        <div className="flex items-center justify-between text-[#B7791F] mb-1">
                            <span className="text-xs font-medium">Degraded</span>
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="text-2xl font-bold text-[#B7791F]">{stats.degraded}</div>
                        <div className="text-[11px] text-[#68727D] mt-0.5">Latency / jitter tinggi</div>
                    </div>

                    <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-3.5 shadow-[var(--shadow-raised)]">
                        <div className="flex items-center justify-between text-[#C62828] mb-1">
                            <span className="text-xs font-medium">Offline</span>
                            <XCircle className="w-4 h-4" />
                        </div>
                        <div className="text-2xl font-bold text-[#C62828]">{stats.offline}</div>
                        <div className="text-[11px] text-[#68727D] mt-0.5">Tidak ada heartbeat</div>
                    </div>
                </div>

                {/* Filters & Actions Bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-4 shadow-[var(--shadow-raised)]">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="w-4 h-4 text-[#68727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari kode, nama, atau host..."
                                    className="w-full h-8 pl-9 pr-3 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                />
                            </div>
                        </form>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="h-8 px-2 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] text-[#252A30] focus:outline-none focus:border-[#E60012]"
                        >
                            <option value="">Semua Tipe</option>
                            <option value="central">Central Gateway</option>
                            <option value="edge">Edge Gateway</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="h-8 px-2 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] text-[#252A30] focus:outline-none focus:border-[#E60012]"
                        >
                            <option value="">Semua Status</option>
                            <option value="online">Online</option>
                            <option value="degraded">Degraded</option>
                            <option value="offline">Offline</option>
                        </select>

                        {/* Store Filter */}
                        <select
                            value={storeFilter}
                            onChange={(e) => handleFilterChange('store_id', e.target.value)}
                            className="h-8 px-2 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] text-[#252A30] focus:outline-none focus:border-[#E60012]"
                        >
                            <option value="">Semua Store</option>
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Create Button */}
                    <Button onClick={openCreateModal} size="sm" className="gap-1.5 shrink-0">
                        <Plus className="w-4 h-4" />
                        <span>Tambah Gateway</span>
                    </Button>
                </div>

                {/* Gateways Table */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#EEF0F2] text-[#68727D] uppercase text-[10px]">
                                <tr>
                                    <th className="p-3">Node Gateway</th>
                                    <th className="p-3">Tipe & Cakupan</th>
                                    <th className="p-3">Host & Port</th>
                                    <th className="p-3">Versi</th>
                                    <th className="p-3">Kamera</th>
                                    <th className="p-3">Status / Heartbeat</th>
                                    <th className="p-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0E4E8]">
                                {gateways.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-[#68727D]">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Network className="w-8 h-8 text-[#A0AEC0]" />
                                                <p className="font-medium text-sm text-[#252A30]">Belum ada Media Gateway</p>
                                                <p className="text-xs">
                                                    Daftarkan node Media Gateway (Central MediaMTX atau Edge Transcoder) untuk routing stream kamera.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    gateways.data.map((gw) => (
                                        <tr key={gw.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            {/* Node & Code */}
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[#EEF0F2] flex items-center justify-center shrink-0 text-[#252A30]">
                                                        {gw.type === 'central' ? (
                                                            <Server className="w-4 h-4 text-[#E60012]" />
                                                        ) : (
                                                            <Network className="w-4 h-4 text-[#252A30]" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-[#252A30] flex items-center gap-1.5">
                                                            <span>{gw.name}</span>
                                                        </div>
                                                        <div className="text-[11px] text-[#68727D] font-mono">
                                                            {gw.code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type & Scope */}
                                            <td className="p-3">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                                        gw.type === 'central'
                                                            ? 'bg-[#FCE8EA] text-[#E60012]'
                                                            : 'bg-[#EEF0F2] text-[#252A30]'
                                                    }`}>
                                                        {gw.type === 'central' ? 'Central Aggregator' : 'Edge Transcoder'}
                                                    </span>
                                                    {gw.store ? (
                                                        <span className="text-[11px] text-[#68727D] flex items-center gap-1">
                                                            <StoreIcon className="w-3 h-3" />
                                                            {gw.store.name} ({gw.store.city})
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-[#68727D]">
                                                            Semua Store (HQ)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Host & Port */}
                                            <td className="p-3">
                                                <div className="font-mono text-[11px] text-[#252A30]">
                                                    {gw.host || '127.0.0.1'}:{gw.port}
                                                </div>
                                            </td>

                                            {/* Version */}
                                            <td className="p-3 text-[#68727D]">
                                                {gw.version || '—'}
                                            </td>

                                            {/* Camera count */}
                                            <td className="p-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF0F2] text-[#252A30]">
                                                    <Cpu className="w-3 h-3 text-[#68727D]" />
                                                    {gw.cameraCount} stream
                                                </span>
                                            </td>

                                            {/* Status & Heartbeat */}
                                            <td className="p-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <div>{getStatusBadge(gw.status)}</div>
                                                    <span className="text-[10px] text-[#68727D]">
                                                        {gw.lastHeartbeatAt ? (
                                                            <>Seen {formatRelativeTime(gw.lastHeartbeatAt)}</>
                                                        ) : (
                                                            'Belum ada heartbeat'
                                                        )}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handlePing(gw)}
                                                        disabled={pingingId === gw.id}
                                                        title="Ping Node / Perbarui Heartbeat"
                                                        className="p-1.5 text-[#68727D] hover:text-[#16834A] hover:bg-[#EEF0F2] rounded transition-colors disabled:opacity-50"
                                                    >
                                                        <RefreshCw className={`w-3.5 h-3.5 ${pingingId === gw.id ? 'animate-spin' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(gw)}
                                                        title="Ubah Konfigurasi"
                                                        className="p-1.5 text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] rounded transition-colors"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(gw)}
                                                        title="Hapus Gateway"
                                                        className="p-1.5 text-[#68727D] hover:text-[#C62828] hover:bg-[#FCE8EA] rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination note */}
                    {gateways.total > 0 && (
                        <div className="p-3 bg-[#EEF0F2] border-t border-[#E0E4E8] text-[11px] text-[#68727D] flex items-center justify-between">
                            <span>
                                Menampilkan {gateways.data.length} dari {gateways.total} gateway
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Create / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="h-12 px-4 border-b border-[#E0E4E8] flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-[#252A30] flex items-center gap-2">
                                <Network className="w-4 h-4 text-[#E60012]" />
                                {editingGateway ? 'Ubah Konfigurasi Media Gateway' : 'Tambah Media Gateway Baru'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-[#68727D] hover:text-[#252A30] rounded hover:bg-[#EEF0F2]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                        Kode Gateway <span className="text-[#E60012]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="e.g. GW-CENTRAL-01"
                                        className="w-full h-8 px-2.5 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                        required
                                    />
                                    {errors.code && <p className="text-[10px] text-[#E60012] mt-0.5">{errors.code}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                        Tipe Node <span className="text-[#E60012]">*</span>
                                    </label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value as GatewayType)}
                                        className="w-full h-8 px-2 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                    >
                                        <option value="edge">Edge Gateway (Per Store)</option>
                                        <option value="central">Central Gateway (HQ Aggregator)</option>
                                    </select>
                                    {errors.type && <p className="text-[10px] text-[#E60012] mt-0.5">{errors.type}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                    Nama Gateway <span className="text-[#E60012]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Central Media Gateway (Jakarta)"
                                    className="w-full h-8 px-2.5 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                    required
                                />
                                {errors.name && <p className="text-[10px] text-[#E60012] mt-0.5">{errors.name}</p>}
                            </div>

                            {data.type === 'edge' && (
                                <div>
                                    <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                        Toko / Store Terkait <span className="text-[#E60012]">*</span>
                                    </label>
                                    <select
                                        value={data.store_id}
                                        onChange={(e) => setData('store_id', e.target.value)}
                                        className="w-full h-8 px-2 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                        required={data.type === 'edge'}
                                    >
                                        <option value="">Pilih Store...</option>
                                        {stores.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.code}) — {s.city}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.store_id && <p className="text-[10px] text-[#E60012] mt-0.5">{errors.store_id}</p>}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                        Host / IP Address
                                    </label>
                                    <input
                                        type="text"
                                        value={data.host}
                                        onChange={(e) => setData('host', e.target.value)}
                                        placeholder="e.g. gw.osave.internal / 192.168.1.1"
                                        className="w-full h-8 px-2.5 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                    />
                                    {errors.host && <p className="text-[10px] text-[#E60012] mt-0.5">{errors.host}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                        Port Layanan
                                    </label>
                                    <input
                                        type="number"
                                        value={data.port}
                                        onChange={(e) => setData('port', Number(e.target.value))}
                                        placeholder="8554"
                                        className="w-full h-8 px-2.5 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                    />
                                    {errors.port && <p className="text-[10px] text-[#E60012] mt-0.5">{errors.port}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                        Status Gateway <span className="text-[#E60012]">*</span>
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as GatewayStatus)}
                                        className="w-full h-8 px-2 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                    >
                                        <option value="online">Online</option>
                                        <option value="degraded">Degraded</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                    {errors.status && <p className="text-[10px] text-[#E60012] mt-0.5">{errors.status}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                        Versi Software
                                    </label>
                                    <input
                                        type="text"
                                        value={data.version}
                                        onChange={(e) => setData('version', e.target.value)}
                                        placeholder="e.g. v1.4.2 (MediaMTX)"
                                        className="w-full h-8 px-2.5 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                    />
                                    {errors.version && <p className="text-[10px] text-[#E60012] mt-0.5">{errors.version}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[#252A30] mb-1">
                                    Catatan Operasional
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Catatan topologi atau konfigurasi jaringan..."
                                    rows={2}
                                    className="w-full p-2 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E0E4E8]">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" loading={processing}>
                                    {editingGateway ? 'Simpan Perubahan' : 'Daftarkan Gateway'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
