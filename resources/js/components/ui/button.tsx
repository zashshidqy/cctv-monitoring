import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2',
        'rounded-[var(--radius-control)] font-medium',
        'transition-all duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'select-none whitespace-nowrap',
    ],
    {
        variants: {
            variant: {
                /** Brand red filled — primary action */
                default: [
                    'bg-[#E60012] text-white',
                    'hover:bg-[#C90016] active:bg-[#B00012]',
                    'shadow-[var(--shadow-raised)]',
                    'focus-visible:ring-[#E60012]',
                ],
                /** Outlined — secondary action */
                outline: [
                    'border border-[var(--color-border)] bg-[var(--color-surface)]',
                    'text-[var(--color-foreground)]',
                    'hover:bg-[var(--color-surface-muted)]',
                    'focus-visible:ring-[var(--color-brand)]',
                ],
                /** No border or background — tertiary / icon actions */
                ghost: [
                    'bg-transparent text-[var(--color-foreground)]',
                    'hover:bg-[var(--color-surface-muted)]',
                    'focus-visible:ring-[var(--color-brand)]',
                ],
                /** Muted surface — alternative secondary */
                secondary: [
                    'bg-[var(--color-surface-muted)] text-[var(--color-foreground)]',
                    'hover:brightness-95',
                    'focus-visible:ring-[var(--color-brand)]',
                ],
                /** Destructive action */
                destructive: [
                    'bg-red-600 text-white',
                    'hover:bg-red-700 active:bg-red-800',
                    'focus-visible:ring-red-500',
                ],
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-9 px-4 text-sm',
                lg: 'h-11 px-6 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    /** Show a spinner and disable interaction while true */
    loading?: boolean;
}

/**
 * Primary interactive element. Supports brand, outline, ghost, secondary, and
 * destructive variants with sm / md / lg sizes. Pass `loading` to show a spinner.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(buttonVariants({ variant, size }), className)}
                {...props}
            >
                {loading && (
                    <svg
                        aria-hidden="true"
                        className="size-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                )}
                {children}
            </button>
        );
    },
);

Button.displayName = 'Button';
