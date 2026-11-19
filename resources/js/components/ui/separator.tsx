import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SeparatorProps
    extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {}

/**
 * Visual divider line between content blocks. Defaults to horizontal orientation.
 * Supports horizontal (1px tall) and vertical (1px wide) layouts.
 */
export const Separator = React.forwardRef<
    React.ComponentRef<typeof SeparatorPrimitive.Root>,
    SeparatorProps
>(
    (
        { className, orientation = 'horizontal', decorative = true, ...props },
        ref,
    ) => (
        <SeparatorPrimitive.Root
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className={cn(
                'shrink-0 bg-[var(--color-border)]',
                orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
                className,
            )}
            {...props}
        />
    ),
);

Separator.displayName = SeparatorPrimitive.Root.displayName;
