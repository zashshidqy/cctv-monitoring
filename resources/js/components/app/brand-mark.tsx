import React from 'react';

interface BrandMarkProps {
    className?: string;
    showWordmark?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * O!Save Monitor Brand Mark
 * Uses O!Save red/white color palette (draft token).
 * Clean geometric logo mark with route/node motif connecting to map monitoring.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
    className = '',
    showWordmark = true,
    size = 'md',
}) => {
    const sizeMap = {
        sm: { icon: 'w-7 h-7 text-xs', text: 'text-sm' },
        md: { icon: 'w-8 h-8 text-sm', text: 'text-base' },
        lg: { icon: 'w-10 h-10 text-base', text: 'text-lg' },
    };

    const currentSize = sizeMap[size];

    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            {/* Logo Mark: O! in brand red with soft neumorphic lift */}
            <div
                className={`
                    ${currentSize.icon}
                    rounded-lg bg-[#E60012] text-white font-bold
                    flex items-center justify-center tracking-tight select-none
                    shadow-[0_2px_8px_rgba(230,0,18,0.25)]
                    transition-transform duration-150 hover:scale-105
                `}
            >
                O!
            </div>

            {showWordmark && (
                <div className="flex flex-col leading-tight select-none">
                    <span className={`font-semibold tracking-tight text-[#252A30] ${currentSize.text}`}>
                        O!Save
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-[#68727D] -mt-0.5">
                        Monitor
                    </span>
                </div>
            )}
        </div>
    );
};

interface BrandedLoaderProps {
    message?: string;
}

/**
 * Branded loading screen for app bootstrap.
 * Uses honest progress, no fake delays, subtle route-line pulse.
 */
export const BrandedLoader: React.FC<BrandedLoaderProps> = ({
    message = 'Memuat sistem...',
}) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5F6] p-4">
            <div className="flex flex-col items-center gap-4">
                {/* Brand Mark with breathing ring */}
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-[#E60012] text-white text-xl font-bold flex items-center justify-center shadow-[0_4px_16px_rgba(230,0,18,0.3)] animate-pulse">
                        O!
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm font-medium text-[#252A30]">{message}</p>
                    <p className="text-xs text-[#68727D] mt-1">O!Save Monitor CCTV Workspace</p>
                </div>

                {/* Indeterminate loading bar — real CSS animation, no fake numbers */}
                <div className="w-40 h-1 bg-[#E0E4E8] rounded-full overflow-hidden mt-2">
                    <div className="w-1/2 h-full bg-[#E60012] rounded-full animate-[loading_1.2s_ease-in-out_infinite]" />
                </div>
            </div>
        </div>
    );
};
