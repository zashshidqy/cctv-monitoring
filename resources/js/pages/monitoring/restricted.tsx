import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { BrandMark } from '@/components/app/brand-mark';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut } from 'lucide-react';

interface RestrictedProps {
    message: string;
}

/**
 * Access Restricted page — shown when user is authenticated
 * but lacks module permissions (e.g. Staff default state).
 */
export default function Restricted({ message }: RestrictedProps) {
    return (
        <div className="min-h-screen bg-[#F4F5F6] flex flex-col justify-center items-center p-4">
            <Head title="Akses Dibatasi — O!Save Monitor" />

            <div className="w-full max-w-md text-center">
                <BrandMark size="lg" className="justify-center mb-6" />

                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-8 shadow-[var(--shadow-raised)]">
                    <div className="w-12 h-12 rounded-full bg-[#FCE8EA] text-[#E60012] flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-6 h-6" />
                    </div>

                    <h2 className="text-base font-semibold text-[#252A30] mb-2">
                        Akses Dibatasi
                    </h2>
                    <p className="text-xs text-[#68727D] leading-relaxed mb-6">
                        {message}
                    </p>

                    <div className="flex justify-center gap-3">
                        <Link href="/logout" method="post" as="button">
                            <Button variant="outline" size="sm" className="gap-2">
                                <LogOut className="w-4 h-4" />
                                <span>Keluar</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
