import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Optional field label rendered above the input */
    label?: string;
    /** Error message — highlights border in red and displays below */
    error?: string;
    /** Informational text rendered below the input */
    helperText?: string;
    /** Optional icon placed at the left of the input */
    leftIcon?: React.ReactNode;
}

/**
 * Text input styled with the surface-inset appearance. Supports an optional
 * integrated label, helper text, and error state.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, leftIcon, id: idProp, type = 'text', ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = idProp ?? generatedId;
        const errorId = `${inputId}-error`;
        const helperId = `${inputId}-helper`;

        const hasError = Boolean(error);

        return (
            <div className="w-full flex flex-col gap-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                    >
                        {label}
                    </label>
                )}

                <div className="relative flex items-center">
                    {leftIcon && (
                        <div className="absolute left-3 pointer-events-none flex items-center justify-center">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={type}
                        aria-invalid={hasError ? 'true' : undefined}
                        aria-describedby={
                            hasError ? errorId : helperText ? helperId : undefined
                        }
                        className={cn(
                            // Surface-inset base
                            'w-full rounded-[var(--radius-control)] border px-3 py-2 text-sm',
                            leftIcon && 'pl-9',
                            'bg-[var(--color-surface-muted)] text-[var(--color-foreground)]',
                            'placeholder:text-[var(--color-muted)]',
                            'transition-colors duration-150',
                            // Default border + focus
                            !hasError && [
                                'border-[var(--color-border)]',
                                'focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/30',
                            ],
                            // Error state
                            hasError && [
                                'border-red-500 text-red-900',
                                'focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30',
                            ],
                            // Disabled
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            className,
                        )}
                        {...props}
                    />
                </div>

                {hasError && <ErrorText id={errorId}>{error}</ErrorText>}
                {!hasError && helperText && <HelperText id={helperId}>{helperText}</HelperText>}
            </div>
        );
    },
);

Input.displayName = 'Input';

// ─── Sub-components ───────────────────────────────────────────────────────────

export interface HelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Informational text placed below a form field.
 */
export function HelperText({ className, children, ...props }: HelperTextProps) {
    return (
        <p className={cn('text-xs text-[var(--color-muted)]', className)} {...props}>
            {children}
        </p>
    );
}

export interface ErrorTextProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Error message placed below a form field, rendered in red text.
 */
export function ErrorText({ className, children, ...props }: ErrorTextProps) {
    return (
        <p
            role="alert"
            className={cn('text-xs font-medium text-red-600', className)}
            {...props}
        >
            {children}
        </p>
    );
}
