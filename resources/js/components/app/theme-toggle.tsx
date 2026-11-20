import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark' | 'system';

export const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || 'system';
        }
        return 'system';
    });
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Apply theme to document
    const applyTheme = (t: Theme) => {
        const root = document.documentElement;
        if (t === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', prefersDark);
            root.classList.toggle('light', !prefersDark);
            setResolvedTheme(prefersDark ? 'dark' : 'light');
        } else {
            root.classList.toggle('dark', t === 'dark');
            root.classList.toggle('light', t === 'light');
            setResolvedTheme(t);
        }
        localStorage.setItem('theme', t);
    };

    // Initialize on mount
    useEffect(() => {
        applyTheme(theme);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const cycleTheme = () => {
        const themes: Theme[] = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        setTheme(nextTheme);
        applyTheme(nextTheme);
    };

    const getIcon = () => {
        switch (theme) {
            case 'light': return <Sun className="w-4 h-4" aria-hidden="true" />;
            case 'dark': return <Moon className="w-4 h-4" aria-hidden="true" />;
            default: return <Monitor className="w-4 h-4" aria-hidden="true" />;
        }
    };

    const getLabel = () => {
        switch (theme) {
            case 'light': return 'Mode Terang';
            case 'dark': return 'Mode Gelap';
            default: return 'Mengikuti Sistem';
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={cycleTheme}
            className="gap-1.5 p-1.5 rounded-[var(--radius-control)] text-[#68727D] dark:text-[#A0AEC0] hover:text-[#252A30] dark:hover:text-white hover:bg-[#EEF0F2] dark:hover:bg-[#2D3748] transition-colors"
            aria-label={`Tema: ${getLabel()} (klik untuk mengubah)`}
            title={`Tema: ${getLabel()} (klik untuk mengubah}`}
        >
            {getIcon()}
            <span className="hidden sm:inline text-xs font-medium">{getLabel()}</span>
        </Button>
    );
};