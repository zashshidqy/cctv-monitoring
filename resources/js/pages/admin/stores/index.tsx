import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Store as StoreIcon,
    MapPin,
    Edit3,
    Trash2,
    X,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';

interface StoreItem {
    id: number;
    code: string;
    name: string;
    address: string;
    city: string;
    region: string;
    postalCode: string | null;
    latitude: number;
    longitude: number;
    status: 'active' | 'inactive';
    notes: string | null;
    deactivatedAt: string | null;
    createdAt: string;
}

interface StoresIndexProps {
    stores: {
        data: StoreItem[];
        links: any[];
        total: number;
    };
    filters: {
        search: string;
        status: string;
    };
}

export default function StoresIndex({ stores, filters }: StoresIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '',
        name: '',
        address: '',
        city: '',
        region: '',
        postal_code: '',
        latitude: '',
        longitude: '',
        status: 'active',
        notes: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/stores',
            { search, status: statusFilter },
            { preserveState: true }
        );
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        router.get(
            '/admin/stores',
            { search, status },
            { preserveState: true }
        );
    };

    const openCreateModal = () => {
        reset();
        setEditingStore(null);
        setIsModalOpen(true);
    };

    const openEditModal = (store: StoreItem) => {
        setEditingStore(store);
        setData({
            code: store.code,
            name: store.name,
            address: store.address,
            city: store.city,
            region: store.region,
            postal_code: store.postalCode || '',
            latitude: String(store.latitude),
            longitude: String(store.longitude),
            status: store.status,
            notes: store.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingStore) {
            put(`/admin/stores/${editingStore.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingStore(null);
                },
            });
        } else {
            post('/admin/stores', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDeactivate = (store: StoreItem) => {
        if (
            confirm(
                `Yakin ingin menonaktifkan store ${store.name} (${store.code})? Store tidak akan muncul di monitoring map.`
            )
        ) {
            router.delete(`/admin/stores/${store.id}`);
        }
    };

    return (
        <AdminLayout title="Manajemen Store">
            <Head title="Manajemen Store — O!Save Monitor" />

            <div className="space-y-5 max-w-6xl">
                {/* Actions & Filters Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-4 shadow-[var(--shadow-raised)]">
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="w-4 h-4 text-[#68727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari kode, nama, atau kota..."
                                    className="w-full h-8 pl-9 pr-3 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                                />
                            </div>
                        </form>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilterChange(e.target.value)}
                            className="h-8 px-2 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] text-[#252A30] focus:outline-none focus:border-[#E60012]"
                        >
                            <option value="">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </select>
                    </div>

                    {/* Create Button */}
                    <Button onClick={openCreateModal} size="sm" className="gap-1.5 shrink-0">
                        <Plus className="w-4 h-4" />
                        <span>Tambah Store</span>
                    </Button>
                </div>

                {/* Stores Table */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#EEF0F2] text-[#68727D] uppercase text-[10px]">
                                <tr>
                                    <th className="p-3">Kode & Nama Store</th>
                                    <th className="p-3">Lokasi / Kota</th>
                                    <th className="p-3">Koordinat GPS</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0E4E8] text-[#252A30]">
                                {stores.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-[#68727D]">
                                            Tidak ada store ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    stores.data.map((store) => (
                                        <tr key={store.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[11px] font-semibold text-[#68727D] bg-[#EEF0F2] px-1.5 py-0.5 rounded">
                                                        {store.code}
                                                    </span>
                                                    <p className="font-semibold text-[#252A30]">
                                                        {store.name}
                                                    </p>
                                                </div>
                                                <p className="text-[11px] text-[#68727D] mt-0.5 line-clamp-1">
                                                    {store.address}
                                                </p>
                                            </td>
                                            <td className="p-3">
                                                <p className="font-medium text-[#252A30]">{store.city}</p>
                                                <p className="text-[10px] text-[#68727D]">{store.region}</p>
                                            </td>
                                            <td className="p-3 font-mono text-[11px] text-[#68727D] whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-[#E60012]" />
                                                    <span>
                                                        {store.latitude.toFixed(5)}, {store.longitude.toFixed(5)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {store.status === 'active' ? (
                                                    <Badge variant="online">Aktif</Badge>
                                                ) : (
                                                    <Badge variant="offline">Nonaktif</Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(store)}
                                                    title="Ubah data store"
                                                    className="p-1.5 rounded-[var(--radius-control)] text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] transition-colors"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>

                                                {store.status === 'active' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeactivate(store)}
                                                        title="Nonaktifkan store (soft deactivation)"
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

                {/* Modal: Create / Edit Store */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-[#E0E4E8] flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-[#252A30]">
                                    {editingStore ? `Ubah Store: ${editingStore.name}` : 'Tambah Store Baru'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-md text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2]"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Kode Store"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        error={errors.code}
                                        placeholder="Misal: DEMO-JKT-03"
                                        required
                                    />
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                                            Status
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value as any)}
                                            className="w-full rounded-[var(--radius-control)] border border-[#E0E4E8] bg-[#EEF0F2] px-3 py-2 text-xs text-[#252A30] focus:outline-none focus:border-[#E60012]"
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Nonaktif</option>
                                        </select>
                                    </div>
                                </div>

                                <Input
                                    label="Nama Store"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    placeholder="Contoh: O!Save Pondok Indah"
                                    required
                                />

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                                        Alamat Lengkap
                                    </label>
                                    <textarea
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-[var(--radius-control)] border border-[#E0E4E8] bg-[#EEF0F2] px-3 py-2 text-xs text-[#252A30] focus:outline-none focus:border-[#E60012]"
                                        placeholder="Jl. Metro Pondok Indah Blok TB..."
                                        required
                                    />
                                    {errors.address && (
                                        <p className="text-[11px] text-[#C62828] mt-1">{errors.address}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2.5">
                                    <Input
                                        label="Kota"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        error={errors.city}
                                        placeholder="Jakarta Selatan"
                                        required
                                    />
                                    <Input
                                        label="Provinsi"
                                        value={data.region}
                                        onChange={(e) => setData('region', e.target.value)}
                                        error={errors.region}
                                        placeholder="DKI Jakarta"
                                        required
                                    />
                                    <Input
                                        label="Kode Pos"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        error={errors.postal_code}
                                        placeholder="12310"
                                    />
                                </div>

                                {/* Coordinate Section */}
                                <div className="p-3 bg-[#EEF0F2] rounded-[var(--radius-control)] border border-[#E0E4E8]">
                                    <p className="text-xs font-semibold text-[#252A30] mb-1">
                                        Koordinat GPS (Presisi Peta)
                                    </p>
                                    <p className="text-[11px] text-[#68727D] mb-2.5">
                                        Gunakan format desimal lintang (lat) dan bujur (lng) untuk posisi marker di MapLibre.
                                    </p>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <Input
                                            label="Latitude"
                                            type="number"
                                            step="any"
                                            value={data.latitude}
                                            onChange={(e) => setData('latitude', e.target.value)}
                                            error={errors.latitude}
                                            placeholder="-6.2731"
                                            required
                                        />
                                        <Input
                                            label="Longitude"
                                            type="number"
                                            step="any"
                                            value={data.longitude}
                                            onChange={(e) => setData('longitude', e.target.value)}
                                            error={errors.longitude}
                                            placeholder="106.8163"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                                        Catatan Tambahan
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-[var(--radius-control)] border border-[#E0E4E8] bg-[#EEF0F2] px-3 py-2 text-xs text-[#252A30] focus:outline-none focus:border-[#E60012]"
                                        placeholder="Informasi akses teknis atau catatan khusus..."
                                    />
                                </div>

                                {/* Footer */}
                                <div className="pt-3 border-t border-[#E0E4E8] flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        size="sm"
                                        loading={processing}
                                    >
                                        {editingStore ? 'Simpan Perubahan' : 'Buat Store'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
