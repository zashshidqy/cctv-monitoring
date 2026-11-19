import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { BrandMark } from '@/components/app/brand-mark';
import { Button } from '@/components/ui/button';
import { Input, HelperText, ErrorText } from '@/components/ui/input';
import { Lock, Mail } from 'lucide-react';

/**
 * Login Page — Clean, professional login with O!Save brand styling.
 * Security: does not reveal whether the username exists on failure.
 */
export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-[#F4F5F6] flex flex-col justify-center items-center p-4">
            <Head title="Masuk — O!Save Monitor" />

            <div className="w-full max-w-sm">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <BrandMark size="lg" className="justify-center mb-3" />
                    <p className="text-xs text-[#68727D] mt-1">
                        Sistem Pemantauan CCTV Multi-Store Internal
                    </p>
                </div>

                {/* Login Card — Modern light neumorphism surface-raised */}
                <div className="bg-white border border-[#E0E4E8] rounded-[var(--radius-panel)] p-6 shadow-[var(--shadow-raised)]">
                    <h2 className="text-base font-semibold text-[#252A30] mb-1">
                        Masuk ke Akun
                    </h2>
                    <p className="text-xs text-[#68727D] mb-5">
                        Gunakan akun internal O!Save yang terdaftar.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <Input
                                id="email"
                                type="email"
                                label="Alamat Email"
                                placeholder="nama@osave.id"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                required
                                autoFocus
                                leftIcon={<Mail className="w-4 h-4 text-[#68727D]" />}
                            />
                            {errors.email && <ErrorText>{errors.email}</ErrorText>}
                        </div>

                        {/* Password */}
                        <div>
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                label="Kata Sandi"
                                placeholder="••••••••"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                required
                                leftIcon={<Lock className="w-4 h-4 text-[#68727D]" />}
                            />
                            {errors.password && <ErrorText>{errors.password}</ErrorText>}
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-[#E0E4E8] text-[#E60012] focus:ring-[#E60012]/30"
                                />
                                <span className="text-[#68727D]">Ingat saya</span>
                            </label>
                        </div>

                        {/* Submit button */}
                        <Button
                            type="submit"
                            variant="default"
                            size="md"
                            loading={processing}
                            className="w-full"
                        >
                            Masuk
                        </Button>
                    </form>

                    {/* Notice for access */}
                    <div className="mt-6 pt-4 border-t border-[#E0E4E8] text-center">
                        <p className="text-[11px] text-[#68727D]">
                            Tidak memiliki akses? Hubungi <span className="font-medium text-[#252A30]">Master Admin</span> untuk permintaan akun dan scope store.
                        </p>
                    </div>
                </div>

                {/* Demo Credentials hint (Epic 1 development only) */}
                <div className="mt-4 p-3 bg-[#EEF0F2] border border-[#E0E4E8] rounded-[var(--radius-card)] text-[11px] text-[#68727D]">
                    <p className="font-semibold text-[#252A30] mb-1">Akun Demo (Epic 1):</p>
                    <ul className="space-y-0.5 font-mono text-[10px]">
                        <li>Admin: <span className="text-[#252A30]">admin@osave.id</span> / Admin123!</li>
                        <li>GM: <span className="text-[#252A30]">gm@osave.id</span> / Gm123!</li>
                        <li>SV Kemang: <span className="text-[#252A30]">sv.kemang@osave.id</span> / Sv123!</li>
                        <li>Staff (no access): <span className="text-[#252A30]">staff@osave.id</span> / Staff123!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
