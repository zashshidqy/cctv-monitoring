import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Placeholder element for loading states. Pulses with a muted background
 * and rounded corners matching design tokens.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]',
                className,
            )}
            {...props}
        />
    );
}
