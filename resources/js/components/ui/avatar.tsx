import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const avatarVariants = cva(
    'relative flex shrink-0 overflow-hidden rounded-full select-none',
    {
        variants: {
            size: {
                sm: 'size-8 text-xs',
                md: 'size-10 text-sm',
                lg: 'size-12 text-base',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    },
);

export interface AvatarProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
        VariantProps<typeof avatarVariants> {}

/**
 * Circular user avatar container. Supports `sm` (32px), `md` (40px), and `lg` (48px) sizes.
 */
export const Avatar = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Root>,
    AvatarProps
>(({ className, size, ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
    />
));

Avatar.displayName = AvatarPrimitive.Root.displayName;

export interface AvatarImageProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {}

/**
 * Image element for the avatar. Automatically hides when loading or on error,
 * deferring to AvatarFallback.
 */
export const AvatarImage = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Image>,
    AvatarImageProps
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={cn('aspect-square size-full object-cover', className)}
        {...props}
    />
));

AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export interface AvatarFallbackProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {}

/**
 * Fallback initials or icon displayed when the image fails to load or is not provided.
 * Uses brand soft background with brand red text.
 */
export const AvatarFallback = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Fallback>,
    AvatarFallbackProps
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            'flex size-full items-center justify-center font-medium',
            'bg-[var(--color-brand-soft,#fee2e2)] text-[var(--color-brand,#E60012)]',
            className,
        )}
        {...props}
    />
));

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
