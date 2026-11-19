import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Video,
    Activity,
    Shield,
    Store,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Edit3,
    Trash2,
    X,
    Wifi,
    ArrowRight,
    ArrowLeft,
    Layers,
    Server,
} from 'lucide-react';

interface StoreOption {
    id: number;
    code: string;
    name: string;
    city: string;
}

interface CameraItem {
    id: number;
    code: string;
    name: string;
    areaLabel: string;
    channelNumber: number | null;
    deviceType: string;
    connectionType: string;
    status: 'online' | 'unstable' | 'offline' | 'unknown';
    isActive: boolean;
    store: {
        id: number;
        code: string;
        name: string;
        city: string;
    };
    sanitizedSource?: Record<string, any>;
    lastCheckedAt: string | null;
    createdAt: string;
}

interface CamerasIndexProps {
    cameras: {
        data: CameraItem[];
        links: any[];
        total: number;
    };
    filters: {
        search: string;
        store_id: string;
        status: string;
        connection_type: string;
    };
    stores: StoreOption[];
}

export default function CamerasIndex({ cameras, filters, stores }: CamerasIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [storeFilter, setStoreFilter] = useState(filters.store_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [connFilter, setConnFilter] = useState(filters.connection_type || '');

    // Wizard modal state
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [editingCamera, setEditingCamera] = useState<CameraItem | null>(null);

    // Test connection state
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        latency_ms?: number | null;
        diagnostics?: Record<string, any>;
    } | null>(null);

    // Form data
    const { data, setData, post, put, processing, errors, reset } = useForm({
        store_id: stores[0]?.id || 1,
        code: '',
        name: '',
        area_label: 'Kasir Utama',
        channel_number: '',
        device_type: 'ip_camera',
        connection_type: 'rtsp',
        status: 'online',
        source_config: {
            host: '',
            port: '554',
            path: '/live/ch0',
            username: '',
            password: '',
            url: '',
            endpoint_url: '',
            snapshot_url: '',
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/cameras',
            {
                search,
                store_id: storeFilter,
                status: statusFilter,
                connection_type: connFilter,
            },
            { preserveState: true }
        );
    };

    const openCreateWizard = () => {
        reset();
        setEditingCamera(null);
        setWizardStep(1);
        setTestResult(null);
        setIsWizardOpen(true);
    };

    const openEditModal = (camera: CameraItem) => {
        setEditingCamera(camera);
        setData({
            store_id: camera.store.id,
            code: camera.code,
            name: camera.name,
            area_label: camera.areaLabel,
            channel_number: camera.channelNumber ? String(camera.channelNumber) : '',
            device_type: camera.deviceType,
            connection_type: camera.connectionType,
            status: camera.status,
            source_config: {
                host: camera.sanitizedSource?.host || '',
                port: String(camera.sanitizedSource?.port || '554'),
                path: camera.sanitizedSource?.path || '/live/ch0',
                username: camera.sanitizedSource?.username || '',
                password: '',
                url: camera.sanitizedSource?.url || '',
                endpoint_url: camera.sanitizedSource?.endpoint_url || '',
                snapshot_url: camera.sanitizedSource?.snapshot_url || '',
            },
        });
        setWizardStep(1);
        setTestResult(null);
        setIsWizardOpen(true);
    };

    const handleRunTest = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const res = await fetch('/admin/cameras/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                            ?.content || '',
                },
                body: JSON.stringify({
                    connection_type: data.connection_type,
                    config: data.source_config,
                }),
            });

            const result = await res.json();
            setTestResult(result);
        } catch (err) {
            setTestResult({
                success: false,
                message: 'Gagal menghubungi server untuk menguji koneksi.',
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCamera) {
            put(`/admin/cameras/${editingCamera.id}`, {
                onSuccess: () => {
                    setIsWizardOpen(false);
                    setEditingCamera(null);
                },
            });
        } else {
            post('/admin/cameras', {
                onSuccess: () => {
                    setIsWizardOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDeactivate = (camera: CameraItem) => {
        if (confirm(`Nonaktifkan kamera ${camera.name} (${camera.code})?`)) {
            router.delete(`/admin/cameras/${camera.id}`);
        }
    };

    const connectionTypes = [
        {
            id: 'rtsp',
            title: 'Manual RTSP',
            desc: 'Direct RTSP stream source ke media gateway (TCP/UDP).',
            icon: Wifi,
        },
        {
            id: 'onvif',
            title: 'ONVIF Profile S/T',
            desc: 'Protokol standar industri untuk discovery & kontrol stream.',
            icon: Server,
        },
        {
            id: 'nvr_channel',
            title: 'NVR / DVR Channel',
            desc: 'Multi-channel stream dari recorder terpusat toko.',
            icon: Layers,
        },
        {
            id: 'hls',
            title: 'HLS Stream URL',
            desc: 'HTTP Live Streaming manifest URL (.m3u8).',
            icon: Video,
        },
        {
            id: 'webrtc',
            title: 'WebRTC (WHEP)',
            desc: 'Ultra-low-latency direct browser media pipeline.',
            icon: Activity,
        },
        {
            id: 'snapshot',
            title: 'Snapshot Polling',
            desc: 'Pengambilan gambar periodik (HTTP JPEG stream).',
            icon: Video,
        },
    ];

    return (
        <AdminLayout title="Manajemen Kamera & Sumber Media">
            <Head title="Manajemen Kamera — O!Save Monitor" />

            <div className="space-y-5 max-w-6xl">
                {/* Actions & Filters Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-4 shadow-[var(--shadow-raised)]">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-xs">
                            <div className="relative">
                                <Search className="w-4 h-4 text-[#68727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari kode, nama, area..."
                                    className="w-full h-8 pl-9 pr-3 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                />
                            </div>
                        </form>

                        {/* Store filter */}
                        <select
                            value={storeFilter}
                            onChange={(e) => {
                                setStoreFilter(e.target.value);
                                router.get(
                                    '/admin/cameras',
                                    {
                                        search,
                                        store_id: e.target.value,
                                        status: statusFilter,
                                        connection_type: connFilter,
                                    },
                                    { preserveState: true }
                                );
                            }}
                            className="h-8 px-2 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] text-[#252A30] focus:outline-none focus:border-[#E60012]"
                        >
                            <option value="">Semua Store</option>
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                router.get(
                                    '/admin/cameras',
                                    {
                                        search,
                                        store_id: storeFilter,
                                        status: e.target.value,
                                        connection_type: connFilter,
                                    },
                                    { preserveState: true }
                                );
                            }}
                            className="h-8 px-2 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] text-[#252A30] focus:outline-none focus:border-[#E60012]"
                        >
                            <option value="">Semua Status</option>
                            <option value="online">Online</option>
                            <option value="unstable">Unstable</option>
                            <option value="offline">Offline</option>
                            <option value="unknown">Unknown</option>
                        </select>
                    </div>

                    {/* Onboard Camera Button */}
                    <Button onClick={openCreateWizard} size="sm" className="gap-1.5 shrink-0">
                        <Plus className="w-4 h-4" />
                        <span>Daftarkan Kamera Baru</span>
                    </Button>
                </div>

                {/* Cameras Table */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#EEF0F2] text-[#68727D] uppercase text-[10px]">
                                <tr>
                                    <th className="p-3">Kode & Nama Kamera</th>
                                    <th className="p-3">Store</th>
                                    <th className="p-3">Area / Channel</th>
                                    <th className="p-3">Metode Koneksi</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0E4E8] text-[#252A30]">
                                {cameras.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-6 text-center text-[#68727D]">
                                            Tidak ada kamera ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    cameras.data.map((cam) => (
                                        <tr key={cam.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[11px] font-semibold text-[#68727D] bg-[#EEF0F2] px-1.5 py-0.5 rounded">
                                                        {cam.code}
                                                    </span>
                                                    <p className="font-semibold text-[#252A30]">{cam.name}</p>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <p className="font-medium text-[#252A30]">{cam.store.name}</p>
                                                <p className="text-[10px] text-[#68727D]">{cam.store.city}</p>
                                            </td>
                                            <td className="p-3">
                                                <p className="font-medium text-[#252A30]">{cam.areaLabel}</p>
                                                {cam.channelNumber && (
                                                    <p className="text-[10px] text-[#68727D]">
                                                        Ch #{cam.channelNumber}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center gap-1 font-mono uppercase text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EEF0F2] text-[#252A30]">
                                                    {cam.connectionType}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <StatusBadge status={cam.status} />
                                            </td>
                                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(cam)}
                                                    title="Ubah konfigurasi kamera"
                                                    className="p-1.5 rounded-[var(--radius-control)] text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] transition-colors"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>

                                                {cam.isActive && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeactivate(cam)}
                                                        title="Nonaktifkan kamera"
                                                        className="p-1.5 rounded-[var(--radius-control)] text-[#68727D] hover:text-[#C62828] hover:bg-[#fee2e2]/60 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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

                {/* Multi-step Onboarding Wizard Modal */}
                {isWizardOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {/* Wizard Header with Steps Progress */}
                            <div className="p-4 border-b border-[#E0E4E8] bg-[#F4F5F6]/60 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-[#252A30]">
                                        {editingCamera
                                            ? `Ubah Kamera: ${editingCamera.name}`
                                            : 'Wizard Pendaftaran Kamera Baru'}
                                    </h3>
                                    <p className="text-[11px] text-[#68727D]">
                                        Langkah {wizardStep} dari 5:{' '}
                                        {wizardStep === 1 && 'Metadata Kamera & Store'}
                                        {wizardStep === 2 && 'Metode Koneksi'}
                                        {wizardStep === 3 && 'Kredensial & Konfigurasi Sumber'}
                                        {wizardStep === 4 && 'Uji Koneksi Server-Side'}
                                        {wizardStep === 5 && 'Tinjau & Simpan'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsWizardOpen(false)}
                                    className="p-1 rounded-md text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2]"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Wizard Body per Step */}
                            <div className="p-5 overflow-y-auto flex-1 space-y-4">
                                {/* STEP 1: Metadata */}
                                {wizardStep === 1 && (
                                    <div className="space-y-3.5">
                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                                                Pilih Store
                                            </label>
                                            <select
                                                value={data.store_id}
                                                onChange={(e) => setData('store_id', Number(e.target.value))}
                                                className="w-full rounded-[var(--radius-control)] border border-[#E0E4E8] bg-[#EEF0F2] px-3 py-2 text-xs text-[#252A30] focus:outline-none focus:border-[#E60012]"
                                            >
                                                {stores.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} ({s.code} - {s.city})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="Kode Kamera (Unik)"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                                error={errors.code}
                                                placeholder="Contoh: CAM-JKT01-01"
                                                required
                                            />
                                            <Input
                                                label="Nama Kamera"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                error={errors.name}
                                                placeholder="Kasir 1 - High Angle"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                                                    Label Area / Zona
                                                </label>
                                                <select
                                                    value={data.area_label}
                                                    onChange={(e) => setData('area_label', e.target.value)}
                                                    className="w-full rounded-[var(--radius-control)] border border-[#E0E4E8] bg-[#EEF0F2] px-3 py-2 text-xs text-[#252A30] focus:outline-none focus:border-[#E60012]"
                                                >
                                                    <option value="Kasir Utama">Kasir Utama</option>
                                                    <option value="Area Pintu Masuk">Area Pintu Masuk</option>
                                                    <option value="Lorong Belakang">Lorong Belakang</option>
                                                    <option value="Loading Dock / Gudang">Loading Dock / Gudang</option>
                                                    <option value="Area Parkir">Area Parkir</option>
                                                    <option value="Chiller / Rak Dingin">Chiller / Rak Dingin</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                                                    Tipe Perangkat
                                                </label>
                                                <select
                                                    value={data.device_type}
                                                    onChange={(e) => setData('device_type', e.target.value)}
                                                    className="w-full rounded-[var(--radius-control)] border border-[#E0E4E8] bg-[#EEF0F2] px-3 py-2 text-xs text-[#252A30] focus:outline-none focus:border-[#E60012]"
                                                >
                                                    <option value="ip_camera">Kamera IP Standalone</option>
                                                    <option value="nvr_channel">Channel NVR</option>
                                                    <option value="dvr_channel">Channel DVR</option>
                                                    <option value="other">Lainnya / Gateway</option>
                                                </select>
                                            </div>
                                        </div>

                                        {(data.device_type === 'nvr_channel' || data.device_type === 'dvr_channel') && (
                                            <Input
                                                label="Nomor Channel NVR/DVR"
                                                type="number"
                                                value={data.channel_number}
                                                onChange={(e) => setData('channel_number', e.target.value)}
                                                error={errors.channel_number}
                                                placeholder="1 - 32"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* STEP 2: Connection Type Selection */}
                                {wizardStep === 2 && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-[#68727D]">
                                            Pilih metode integrasi sumber stream ke Media Gateway:
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {connectionTypes.map((t) => {
                                                const Icon = t.icon;
                                                const isSelected = data.connection_type === t.id;
                                                return (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => setData('connection_type', t.id)}
                                                        className={`p-3 rounded-[var(--radius-control)] border transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-[#FCE8EA]/50 border-[#E60012] shadow-xs ring-1 ring-[#E60012]/30'
                                                                : 'bg-white border-[#E0E4E8] hover:border-[#68727D]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div
                                                                className={`p-1.5 rounded ${
                                                                    isSelected
                                                                        ? 'bg-[#E60012] text-white'
                                                                        : 'bg-[#EEF0F2] text-[#68727D]'
                                                                }`}
                                                            >
                                                                <Icon className="w-3.5 h-3.5" />
                                                            </div>
                                                            <p className="text-xs font-semibold text-[#252A30]">
                                                                {t.title}
                                                            </p>
                                                        </div>
                                                        <p className="text-[11px] text-[#68727D]">{t.desc}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Connection Settings & Secrets */}
                                {wizardStep === 3 && (
                                    <div className="space-y-3.5">
                                        <div className="p-3 bg-[#EEF0F2] rounded-[var(--radius-control)] text-xs text-[#68727D] flex items-start gap-2">
                                            <Shield className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
                                            <span>
                                                Kredensial disimpan dalam format <strong>terenkripsi (AES-256)</strong> pada database server. Kata sandi tidak pernah dikirim balik ke browser client.
                                            </span>
                                        </div>

                                        {(data.connection_type === 'rtsp' ||
                                            data.connection_type === 'onvif' ||
                                            data.connection_type === 'nvr_channel' ||
                                            data.connection_type === 'dvr_channel') && (
                                            <>
                                                <div className="grid grid-cols-3 gap-2.5">
                                                    <div className="col-span-2">
                                                        <Input
                                                            label="Host / IP Kamera"
                                                            value={data.source_config.host}
                                                            onChange={(e) =>
                                                                setData('source_config', {
                                                                    ...data.source_config,
                                                                    host: e.target.value,
                                                                })
                                                            }
                                                            placeholder="192.168.1.100 atau cam1.store.local"
                                                            required
                                                        />
                                                    </div>
                                                    <Input
                                                        label="Port"
                                                        value={data.source_config.port}
                                                        onChange={(e) =>
                                                            setData('source_config', {
                                                                ...data.source_config,
                                                                port: e.target.value,
                                                            })
                                                        }
                                                        placeholder="554"
                                                    />
                                                </div>

                                                <Input
                                                    label="Stream Path / Channel Profile"
                                                    value={data.source_config.path}
                                                    onChange={(e) =>
                                                        setData('source_config', {
                                                            ...data.source_config,
                                                            path: e.target.value,
                                                        })
                                                    }
                                                    placeholder="/live/ch0 atau /onvif1"
                                                />

                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        label="Username Kamera"
                                                        value={data.source_config.username}
                                                        onChange={(e) =>
                                                            setData('source_config', {
                                                                ...data.source_config,
                                                                username: e.target.value,
                                                            })
                                                        }
                                                        placeholder="admin"
                                                    />
                                                    <Input
                                                        label={editingCamera ? 'Password Baru (opsional)' : 'Password Kamera'}
                                                        type="password"
                                                        value={data.source_config.password}
                                                        onChange={(e) =>
                                                            setData('source_config', {
                                                                ...data.source_config,
                                                                password: e.target.value,
                                                            })
                                                        }
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {data.connection_type === 'hls' && (
                                            <Input
                                                label="URL Manifest HLS (.m3u8)"
                                                value={data.source_config.url}
                                                onChange={(e) =>
                                                    setData('source_config', {
                                                        ...data.source_config,
                                                        url: e.target.value,
                                                    })
                                                }
                                                placeholder="https://stream.internal/live/cam01/index.m3u8"
                                                required
                                            />
                                        )}

                                        {data.connection_type === 'webrtc' && (
                                            <Input
                                                label="Endpoint WebRTC (WHEP URL)"
                                                value={data.source_config.endpoint_url}
                                                onChange={(e) =>
                                                    setData('source_config', {
                                                        ...data.source_config,
                                                        endpoint_url: e.target.value,
                                                    })
                                                }
                                                placeholder="https://mediamtx.internal:8889/cam01/whep"
                                                required
                                            />
                                        )}

                                        {data.connection_type === 'snapshot' && (
                                            <Input
                                                label="URL Endpoint Gambar Snapshot"
                                                value={data.source_config.snapshot_url}
                                                onChange={(e) =>
                                                    setData('source_config', {
                                                        ...data.source_config,
                                                        snapshot_url: e.target.value,
                                                    })
                                                }
                                                placeholder="http://192.168.1.100/cgi-bin/snapshot.jpg"
                                                required
                                            />
                                        )}
                                    </div>
                                )}

                                {/* STEP 4: Server-Side Connection Test */}
                                {wizardStep === 4 && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-xs">
                                            <h4 className="text-xs font-semibold text-[#252A30] mb-1">
                                                Uji Kelayakan Koneksi Server-Side
                                            </h4>
                                            <p className="text-[11px] text-[#68727D] mb-3">
                                                Pemeriksaan TCP handshake, validasi format endpoint, dan latensi respons dilakukan langsung oleh server aplikasi (dengan proteksi SSRF).
                                            </p>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRunTest}
                                                loading={isTesting}
                                                className="w-full gap-2"
                                            >
                                                <Wifi className="w-4 h-4 text-[#E60012]" />
                                                <span>Jalankan Pengujian Sekarang</span>
                                            </Button>
                                        </div>

                                        {testResult && (
                                            <div
                                                className={`p-4 rounded-[var(--radius-panel)] border text-xs animate-in fade-in duration-150 ${
                                                    testResult.success
                                                        ? 'bg-[#dcfce7]/50 border-[#16834A]/30 text-[#16834A]'
                                                        : 'bg-[#fee2e2]/50 border-[#C62828]/30 text-[#C62828]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1.5 font-semibold">
                                                    {testResult.success ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4" />
                                                    )}
                                                    <span>{testResult.message}</span>
                                                </div>

                                                {testResult.latency_ms !== null && (
                                                    <p className="text-[11px] mt-1 font-mono">
                                                        Latensi Respons: {testResult.latency_ms} ms
                                                    </p>
                                                )}

                                                {testResult.diagnostics && (
                                                    <div className="mt-2.5 pt-2 border-t border-black/10 text-[10px] font-mono space-y-0.5">
                                                        {Object.entries(testResult.diagnostics).map(([k, v]) => (
                                                            <div key={k} className="flex justify-between">
                                                                <span className="opacity-70">{k}:</span>
                                                                <span>{String(v)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 5: Review & Save */}
                                {wizardStep === 5 && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-[#EEF0F2] rounded-[var(--radius-panel)] space-y-2 text-xs">
                                            <h4 className="font-semibold text-[#252A30] uppercase tracking-wider text-[10px]">
                                                Ringkasan Pendaftaran Kamera
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                <div>
                                                    <span className="text-[#68727D]">Kode:</span>{' '}
                                                    <strong className="text-[#252A30]">{data.code}</strong>
                                                </div>
                                                <div>
                                                    <span className="text-[#68727D]">Nama:</span>{' '}
                                                    <strong className="text-[#252A30]">{data.name}</strong>
                                                </div>
                                                <div>
                                                    <span className="text-[#68727D]">Area:</span>{' '}
                                                    <span className="text-[#252A30]">{data.area_label}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[#68727D]">Koneksi:</span>{' '}
                                                    <span className="text-[#252A30] uppercase font-mono">
                                                        {data.connection_type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-[#68727D]">
                                            Klik tombol <strong>Simpan & Aktifkan Kamera</strong> di bawah untuk menyelesaikan proses onboarding.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Wizard Footer Controls */}
                            <div className="p-4 border-t border-[#E0E4E8] bg-[#F4F5F6]/40 flex items-center justify-between">
                                {wizardStep > 1 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                                        className="gap-1"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        <span>Kembali</span>
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsWizardOpen(false)}
                                    >
                                        Batal
                                    </Button>
                                )}

                                {wizardStep < 5 ? (
                                    <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                                        className="gap-1"
                                    >
                                        <span>Lanjutkan</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={handleSubmit}
                                        loading={processing}
                                    >
                                        {editingCamera ? 'Simpan Perubahan' : 'Simpan & Aktifkan Kamera'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
