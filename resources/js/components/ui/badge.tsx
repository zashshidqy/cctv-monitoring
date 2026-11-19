import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';
import type { CameraStatus, MarkerStatus } from '@/types';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-none',
    {
        variants: {
            variant: {
                /** Neutral surface — default state */
                default: 'bg-[var(--color-surface-muted)] text-[var(--color-foreground)]',
                /** Camera / store fully reachable */
                online: 'bg-green-100 text-green-700',
                /** Camera signal degraded */
                unstable: 'bg-amber-100 text-amber-700',
                /** Camera / store unreachable */
                offline: 'bg-red-100 text-red-700',
                /** Status not yet determined */
                unknown: 'bg-[var(--color-surface-muted)] text-[var(--color-muted)]',
                /** Partial — some cameras have issues (marker level) */
                partial: 'bg-orange-100 text-orange-700',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof badgeVariants> {}

/**
 * Small pill label for status or category tags. Use `variant` to communicate
 * semantic meaning (online / unstable / offline / unknown / partial).
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// ─── Camera status → badge variant ───────────────────────────────────────────

const cameraStatusVariant: Record<CameraStatus, BadgeProps['variant']> = {
    online: 'online',
    unstable: 'unstable',
    offline: 'offline',
    unknown: 'unknown',
};

const cameraStatusLabel: Record<CameraStatus, string> = {
    online: 'Online',
    unstable: 'Tidak Stabil',
    offline: 'Offline',
    unknown: 'Tidak Diketahui',
};

// ─── Marker / store status → badge variant ────────────────────────────────────

const markerStatusVariant: Record<MarkerStatus, BadgeProps['variant']> = {
    online: 'online',
    partial: 'partial',
    offline: 'offline',
    unknown: 'unknown',
};

const markerStatusLabel: Record<MarkerStatus, string> = {
    online: 'Semua Online',
    partial: 'Sebagian Bermasalah',
    offline: 'Semua Offline',
    unknown: 'Tidak Diketahui',
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Either a camera-level or marker-level status string */
    status: CameraStatus | MarkerStatus;
}

/**
 * Convenience wrapper that picks the correct `variant` and label text from a
 * raw `CameraStatus` or `MarkerStatus` value.
 */
export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
    // Resolve variant — camera statuses take precedence, then marker statuses
    const isCameraStatus = (s: string): s is CameraStatus =>
        s === 'online' || s === 'unstable' || s === 'offline' || s === 'unknown';

    const isMarkerStatus = (s: string): s is MarkerStatus =>
        s === 'online' || s === 'partial' || s === 'offline' || s === 'unknown';

    let variant: BadgeProps['variant'] = 'default';
    let label: string = status;

    if (isCameraStatus(status) && status in cameraStatusVariant) {
        variant = cameraStatusVariant[status];
        label = cameraStatusLabel[status];
    } else if (isMarkerStatus(status) && status in markerStatusVariant) {
        variant = markerStatusVariant[status];
        label = markerStatusLabel[status];
    }

    return (
        <Badge variant={variant} className={className} {...props}>
            {label}
        </Badge>
    );
}
