import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}) => {
    const baseStyles = 'bg-[#E0E4E8] rounded overflow-hidden';
    const variantStyles = {
        text: 'rounded-[var(--radius-control)] h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-[var(--radius-control)]',
    };
    const animationStyles = {
        pulse: 'animate-pulse',
        wave: 'animate-[shimmer_1.5s_infinite]',
        none: '',
    };

    const style: React.CSSProperties = {
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    };

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 3,
    className = '',
}) => (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%' } />
        ))}
    </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white border border-[#E0E4E8] rounded-[var(--radius-card)] p-4 space-y-3 ${className}`} aria-hidden="true">
        <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-1">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="30%" />
            </div>
        </div>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
    </div>
);

export const SkeletonMapMarker: React.FC = () => (
    <div className="relative w-9 h-9" aria-hidden="true">
        <Skeleton variant="circular" width={36} height={36} className="absolute inset-0" />
        <Skeleton variant="circular" width={12} height={12} className="absolute -top-1 -right-1 border-2 border-white" />
    </div>
);

export const SkeletonDrawer: React.FC = () => (
    <div className="h-full flex flex-col space-y-4 p-4" aria-hidden="true">
        <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={28} height={28} className="bg-[#E60012]" />
            <div className="space-y-1">
                <Skeleton variant="text" width="80px" />
                <Skeleton variant="text" width="60px" />
            </div>
        </div>
        <Skeleton className="h-px bg-[#E0E4E8]" />
        <div className="space-y-3 flex-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
        <Skeleton className="h-10 w-full" />
    </div>
);