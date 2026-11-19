import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input, ErrorText } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Shield,
    Store,
    KeyRound,
    UserCheck,
    UserX,
    Lock,
    Edit3,
    Trash2,
    X,
} from 'lucide-react';

interface RoleOption {
    id: number;
    name: string;
    slug: string;
}

interface StoreOption {
    id: number;
    code: string;
    name: string;
    city: string;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'inactive' | 'locked';
    role: RoleOption | null;
    assignedStores: { id: number; code: string; name: string }[];
    lastLoginAt: string | null;
    createdAt: string;
}

interface UsersIndexProps {
    users: {
        data: UserItem[];
        links: any[];
        total: number;
    };
    filters: {
        search: string;
        role: string;
    };
    roles: RoleOption[];
    stores: StoreOption[];
}

export default function UsersIndex({ users, filters, roles, stores }: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    // Form for Create / Edit
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role_id: roles[0]?.id || 1,
        status: 'active',
        assigned_store_ids: [] as number[],
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/users', { search, role: filters.role }, { preserveState: true });
    };

    const openCreateModal = () => {
        reset();
        setEditingUser(null);
        setIsCreateOpen(true);
    };

    const openEditModal = (user: UserItem) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            role_id: user.role?.id || roles[0]?.id || 1,
            status: user.status,
            assigned_store_ids: user.assignedStores.map((s) => s.id),
        });
        setIsCreateOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            put(`/admin/users/${editingUser.id}`, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setEditingUser(null);
                },
            });
        } else {
            post('/admin/users', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDeactivate = (user: UserItem) => {
        if (confirm(`Yakin ingin menonaktifkan akun ${user.name}?`)) {
            router.delete(`/admin/users/${user.id}`);
        }
    };

    const toggleStoreSelection = (storeId: number) => {
        const current = data.assigned_store_ids;
        if (current.includes(storeId)) {
            setData('assigned_store_ids', current.filter((id) => id !== storeId));
        } else {
            setData('assigned_store_ids', [...current, storeId]);
        }
    };

    const selectedRoleSlug = roles.find((r) => r.id === Number(data.role_id))?.slug;
    const isScopedRole = selectedRoleSlug === 'sv' || selectedRoleSlug === 'staff';

    return (
        <AdminLayout title="Manajemen Pengguna">
            <Head title="Manajemen Pengguna — O!Save Monitor" />

            <div className="space-y-5 max-w-6xl">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-4 shadow-[var(--shadow-raised)]">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-sm">
                        <div className="relative">
                            <Search className="w-4 h-4 text-[#68727D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau email..."
                                className="w-full h-8 pl-9 pr-3 text-xs bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-control)] focus:outline-none focus:border-[#E60012]"
                            />
                        </div>
                    </form>

                    {/* Create Button */}
                    <Button onClick={openCreateModal} size="sm" className="gap-1.5 shrink-0">
                        <Plus className="w-4 h-4" />
                        <span>Tambah Pengguna</span>
                    </Button>
                </div>

                {/* Users Table */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#EEF0F2] text-[#68727D] uppercase text-[10px]">
                                <tr>
                                    <th className="p-3">Nama & Email</th>
                                    <th className="p-3">Peran (Role)</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Scope Store</th>
                                    <th className="p-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0E4E8] text-[#252A30]">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                                        <td className="p-3">
                                            <p className="font-semibold text-[#252A30]">{user.name}</p>
                                            <p className="text-[11px] text-[#68727D]">{user.email}</p>
                                        </td>
                                        <td className="p-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEF0F2] text-[#252A30]">
                                                <Shield className="w-3 h-3 text-[#E60012]" />
                                                {user.role?.name || 'Belum Diatur'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {user.status === 'active' && (
                                                <Badge variant="online">Aktif</Badge>
                                            )}
                                            {user.status === 'inactive' && (
                                                <Badge variant="offline">Nonaktif</Badge>
                                            )}
                                            {user.status === 'locked' && (
                                                <Badge variant="unstable">Terkunci</Badge>
                                            )}
                                        </td>
                                        <td className="p-3 max-w-xs">
                                            {user.role?.slug === 'master_admin' || user.role?.slug === 'gm' ? (
                                                <span className="text-[11px] font-medium text-[#16834A]">
                                                    Global (Semua Store)
                                                </span>
                                            ) : user.assignedStores.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.assignedStores.map((s) => (
                                                        <span
                                                            key={s.id}
                                                            className="px-1.5 py-0.5 rounded bg-[#EEF0F2] text-[10px] text-[#252A30]"
                                                        >
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-[#C62828] font-medium">
                                                    Belum Ada Scope
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                            {/* Custom Permission Overrides Link */}
                                            <Link
                                                href={`/admin/users/${user.id}/permissions`}
                                                title="Kelola izin khusus (override)"
                                                className="inline-flex p-1.5 rounded-[var(--radius-control)] text-[#68727D] hover:text-[#E60012] hover:bg-[#FCE8EA] transition-colors"
                                            >
                                                <KeyRound className="w-3.5 h-3.5" />
                                            </Link>

                                            {/* Edit */}
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(user)}
                                                title="Ubah data pengguna"
                                                className="p-1.5 rounded-[var(--radius-control)] text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2] transition-colors"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Deactivate */}
                                            {user.status === 'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeactivate(user)}
                                                    title="Nonaktifkan pengguna"
                                                    className="p-1.5 rounded-[var(--radius-control)] text-[#68727D] hover:text-[#C62828] hover:bg-[#fee2e2]/60 transition-colors"
                                                >
                                                    <UserX className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal: Create / Edit User */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised-lg)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {/* Header */}
                            <div className="p-4 border-b border-[#E0E4E8] flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-[#252A30]">
                                    {editingUser ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-1 rounded-md text-[#68727D] hover:text-[#252A30] hover:bg-[#EEF0F2]"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form Body */}
                            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                                <Input
                                    label="Nama Lengkap"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    placeholder="Contoh: Ahmad Fauzi"
                                    required
                                />

                                <Input
                                    label="Alamat Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                    placeholder="nama@osave.id"
                                    required
                                />

                                <Input
                                    label={editingUser ? 'Kata Sandi Baru (kosongkan jika tidak diubah)' : 'Kata Sandi'}
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                    placeholder="Minimal 8 karakter"
                                    required={!editingUser}
                                />

                                {/* Role selection */}
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                                        Peran (Role)
                                    </label>
                                    <select
                                        value={data.role_id}
                                        onChange={(e) => setData('role_id', Number(e.target.value))}
                                        className="w-full rounded-[var(--radius-control)] border border-[#E0E4E8] bg-[#EEF0F2] px-3 py-2 text-xs text-[#252A30] focus:outline-none focus:border-[#E60012]"
                                    >
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status selection */}
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                                        Status Akun
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as any)}
                                        className="w-full rounded-[var(--radius-control)] border border-[#E0E4E8] bg-[#EEF0F2] px-3 py-2 text-xs text-[#252A30] focus:outline-none focus:border-[#E60012]"
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Nonaktif</option>
                                        <option value="locked">Terkunci</option>
                                    </select>
                                </div>

                                {/* Store scope selector (only for SV or Staff) */}
                                {isScopedRole && (
                                    <div className="p-3 bg-[#EEF0F2] rounded-[var(--radius-control)] border border-[#E0E4E8]">
                                        <p className="text-xs font-semibold text-[#252A30] mb-1">
                                            Store Scope Assignment
                                        </p>
                                        <p className="text-[11px] text-[#68727D] mb-2.5">
                                            Pilih store yang dapat diakses oleh user ini.
                                        </p>

                                        <div className="max-h-36 overflow-y-auto space-y-1.5">
                                            {stores.map((s) => {
                                                const checked = data.assigned_store_ids.includes(s.id);
                                                return (
                                                    <label
                                                        key={s.id}
                                                        className="flex items-center gap-2 p-1.5 rounded bg-white border border-[#E0E4E8] text-xs cursor-pointer hover:border-[#E60012]/40"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleStoreSelection(s.id)}
                                                            className="w-3.5 h-3.5 rounded border-[#E0E4E8] text-[#E60012] focus:ring-[#E60012]/20"
                                                        />
                                                        <span className="font-medium text-[#252A30]">{s.name}</span>
                                                        <span className="text-[10px] text-[#68727D]">({s.city})</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div className="pt-3 border-t border-[#E0E4E8] flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCreateOpen(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        size="sm"
                                        loading={processing}
                                    >
                                        {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
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
