import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Shield, KeyRound, Check, Users, Lock, AlertTriangle } from 'lucide-react';

interface RoleData {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    isSystemRole: boolean;
    userCount: number;
    permissionIds: number[];
}

interface PermissionData {
    id: number;
    name: string;
    slug: string;
    module: string;
    description: string | null;
}

interface RolesIndexProps {
    roles: RoleData[];
    permissionsByModule: Record<string, PermissionData[]>;
}

export default function RolesIndex({ roles, permissionsByModule }: RolesIndexProps) {
    // Select role to configure (Staff is the primary mutable role template)
    const [selectedRole, setSelectedRole] = useState<RoleData>(
        roles.find((r) => r.slug === 'staff') || roles[0]
    );

    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
        selectedRole.permissionIds
    );

    const { put, processing } = useForm();

    const handleRoleSelect = (role: RoleData) => {
        setSelectedRole(role);
        setSelectedPermissions(role.permissionIds);
    };

    const togglePermission = (permId: number) => {
        if (selectedRole.slug === 'master_admin') return; // Master Admin is locked

        if (selectedPermissions.includes(permId)) {
            setSelectedPermissions(selectedPermissions.filter((id) => id !== permId));
        } else {
            setSelectedPermissions([...selectedPermissions, permId]);
        }
    };

    const handleSavePermissions = (e: React.FormEvent) => {
        e.preventDefault();
        router.put(
            `/admin/roles-permissions/${selectedRole.id}`,
            { permission_ids: selectedPermissions },
            { preserveState: true }
        );
    };

    const isLockedRole = selectedRole.slug === 'master_admin';

    return (
        <AdminLayout title="Katalog Peran & Matriks Izin">
            <Head title="Katalog Peran & Izin — O!Save Monitor" />

            <div className="space-y-6 max-w-6xl">
                {/* Roles Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {roles.map((role) => {
                        const isSelected = selectedRole.id === role.id;
                        return (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => handleRoleSelect(role)}
                                className={`text-left p-4 rounded-[var(--radius-panel)] border transition-all ${
                                    isSelected
                                        ? 'bg-white border-[#E60012] shadow-[var(--shadow-raised-lg)] ring-2 ring-[#E60012]/20'
                                        : 'bg-white border-[#E0E4E8] shadow-[var(--shadow-raised)] hover:border-[#E60012]/40'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#FCE8EA] text-[#E60012] flex items-center justify-center">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF0F2] text-[#68727D]">
                                        {role.userCount} User
                                    </span>
                                </div>

                                <h3 className="text-sm font-semibold text-[#252A30] mb-1">
                                    {role.name}
                                </h3>
                                <p className="text-[11px] text-[#68727D] line-clamp-2">
                                    {role.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Role Permission Matrix Configurator */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-6 shadow-[var(--shadow-raised)]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#E0E4E8]">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold text-[#252A30]">
                                    Matriks Izin: {selectedRole.name}
                                </h3>
                                {isLockedRole ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-[#68727D] bg-[#EEF0F2] px-2 py-0.5 rounded">
                                        <Lock className="w-3 h-3 text-[#E60012]" /> Terkunci (Sistem)
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-[#16834A] bg-[#dcfce7] px-2 py-0.5 rounded font-medium">
                                        Dapat Dikonfigurasi
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[#68727D]">
                                {selectedRole.slug === 'staff'
                                    ? 'Template izin default untuk seluruh pengguna ber-role Staff. Staff baru akan mewarisi set izin ini.'
                                    : selectedRole.description}
                            </p>
                        </div>

                        {!isLockedRole && (
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={handleSavePermissions}
                                loading={processing}
                            >
                                Simpan Perubahan Matriks
                            </Button>
                        )}
                    </div>

                    {/* Permissions Grouped by Module */}
                    <div className="mt-6 space-y-6">
                        {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                            <div key={moduleName} className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#68727D]">
                                    Modul: {moduleName}
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {perms.map((perm) => {
                                        const isGranted =
                                            selectedRole.slug === 'master_admin' ||
                                            selectedPermissions.includes(perm.id);

                                        return (
                                            <div
                                                key={perm.id}
                                                onClick={() => !isLockedRole && togglePermission(perm.id)}
                                                className={`p-3 rounded-[var(--radius-control)] border text-xs transition-colors flex items-start gap-2.5 ${
                                                    isLockedRole
                                                        ? 'bg-[#F4F5F6] border-[#E0E4E8] cursor-not-allowed opacity-80'
                                                        : isGranted
                                                        ? 'bg-[#FCE8EA]/40 border-[#E60012]/40 cursor-pointer'
                                                        : 'bg-white border-[#E0E4E8] hover:border-[#68727D] cursor-pointer'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isGranted}
                                                    disabled={isLockedRole}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 rounded border-[#E0E4E8] text-[#E60012] focus:ring-[#E60012]/20 mt-0.5 pointer-events-none"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-[#252A30]">
                                                        {perm.name}
                                                    </p>
                                                    <p className="text-[10px] text-[#68727D] mt-0.5">
                                                        {perm.description || perm.slug}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
