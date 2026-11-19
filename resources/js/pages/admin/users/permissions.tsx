import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface PermissionItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    isRoleDefault: boolean;
    override: 'grant' | 'deny' | null;
    isEffective: boolean;
}

interface TargetUser {
    id: number;
    name: string;
    email: string;
    role: string | null;
    roleSlug: string | null;
}

interface PermissionsEditorProps {
    targetUser: TargetUser;
    permissionsByModule: Record<string, PermissionItem[]>;
}

export default function PermissionsEditor({
    targetUser,
    permissionsByModule,
}: PermissionsEditorProps) {
    // Flatten initial override states
    const initialOverrides: Record<number, { effect: 'grant' | 'deny' | 'none'; reason: string }> = {};

    Object.values(permissionsByModule).forEach((modulePerms) => {
        modulePerms.forEach((p) => {
            initialOverrides[p.id] = {
                effect: p.override ?? 'none',
                reason: '',
            };
        });
    });

    const [overrides, setOverrides] = useState(initialOverrides);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEffectChange = (permId: number, effect: 'grant' | 'deny' | 'none') => {
        setOverrides((prev) => ({
            ...prev,
            [permId]: {
                ...prev[permId],
                effect,
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = Object.entries(overrides).map(([permId, val]) => ({
            permission_id: Number(permId),
            effect: val.effect,
            reason: val.reason,
        }));

        router.post(
            `/admin/users/${targetUser.id}/permissions`,
            { overrides: payload },
            {
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    return (
        <AdminLayout title="Kelola Izin Khusus Pengguna">
            <Head title={`Izin Khusus — ${targetUser.name}`} />

            <div className="space-y-6 max-w-4xl">
                {/* User Summary Card */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-5 shadow-[var(--shadow-raised)] flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/admin/users"
                                className="text-[#68727D] hover:text-[#252A30] transition-colors p-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <h2 className="text-base font-semibold text-[#252A30]">
                                {targetUser.name}
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#EEF0F2] text-[#252A30]">
                                {targetUser.role || 'Tanpa Peran'}
                            </span>
                        </div>
                        <p className="text-xs text-[#68727D] pl-7">{targetUser.email}</p>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-[#68727D]">Model Izin</p>
                        <p className="text-xs font-semibold text-[#252A30]">
                            RBAC + Per-User Override
                        </p>
                    </div>
                </div>

                {/* Explanatory Notice */}
                <div className="p-3.5 bg-[#EEF0F2] rounded-[var(--radius-card)] text-xs text-[#68727D] flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-[#252A30]">Aturan Override Izin Pengguna</p>
                        <p className="mt-0.5">
                            Override eksplisit akan mengesampingkan default peran (Role). Pilih{' '}
                            <strong>Grant</strong> untuk memberi izin tambahan, <strong>Deny</strong>{' '}
                            untuk memblokir izin tertentu, atau <strong>Default</strong> untuk mengikuti
                            aturan bawaan peran.
                        </p>
                    </div>
                </div>

                {/* Module-by-Module Permission Matrix Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                        <div
                            key={moduleName}
                            className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] shadow-[var(--shadow-raised)] overflow-hidden"
                        >
                            <div className="bg-[#EEF0F2] px-4 py-2.5 border-b border-[#E0E4E8] flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#252A30]">
                                    Modul: {moduleName}
                                </h3>
                                <span className="text-[10px] text-[#68727D]">
                                    {perms.length} Izin
                                </span>
                            </div>

                            <div className="divide-y divide-[#E0E4E8]">
                                {perms.map((p) => {
                                    const currentOverride = overrides[p.id]?.effect ?? 'none';

                                    return (
                                        <div
                                            key={p.id}
                                            className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#F4F5F6]/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-semibold text-[#252A30]">
                                                        {p.name}
                                                    </p>
                                                    <code className="text-[10px] px-1.5 py-0.5 bg-[#EEF0F2] text-[#68727D] rounded">
                                                        {p.slug}
                                                    </code>
                                                    {p.isRoleDefault && (
                                                        <span className="text-[10px] text-[#16834A] font-medium">
                                                            (Bawaan Peran)
                                                        </span>
                                                    )}
                                                </div>
                                                {p.description && (
                                                    <p className="text-[11px] text-[#68727D] mt-0.5">
                                                        {p.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Radio Group: Default | Grant | Deny */}
                                            <div className="flex items-center gap-1.5 bg-[#EEF0F2] p-1 rounded-[var(--radius-control)]">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEffectChange(p.id, 'none')}
                                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                                        currentOverride === 'none'
                                                            ? 'bg-white text-[#252A30] shadow-xs'
                                                            : 'text-[#68727D] hover:text-[#252A30]'
                                                    }`}
                                                >
                                                    Default
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEffectChange(p.id, 'grant')}
                                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                                        currentOverride === 'grant'
                                                            ? 'bg-[#16834A] text-white shadow-xs'
                                                            : 'text-[#68727D] hover:text-[#16834A]'
                                                    }`}
                                                >
                                                    Grant (+)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEffectChange(p.id, 'deny')}
                                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                                        currentOverride === 'deny'
                                                            ? 'bg-[#C62828] text-white shadow-xs'
                                                            : 'text-[#68727D] hover:text-[#C62828]'
                                                    }`}
                                                >
                                                    Deny (-)
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Bottom Save Bar */}
                    <div className="sticky bottom-4 bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-4 shadow-[var(--shadow-raised-lg)] flex items-center justify-between">
                        <Link href="/admin/users">
                            <Button type="button" variant="outline" size="sm">
                                Batal
                            </Button>
                        </Link>

                        <Button type="submit" variant="default" size="sm" loading={isSubmitting}>
                            Simpan Perubahan Izin
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
