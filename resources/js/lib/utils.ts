import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names safely, resolving conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/**
 * Format a date/time string for display in the UI.
 * Returns a locale-aware relative or absolute time.
 */
export function formatDateTime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a relative time (e.g. "2 menit lalu").
 */
export function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    return `${Math.floor(seconds / 86400)} hari lalu`;
}

/**
 * Camera status to human-readable label (Bahasa Indonesia).
 */
export function cameraStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        online: 'Online',
        unstable: 'Tidak Stabil',
        offline: 'Offline',
        unknown: 'Tidak Diketahui',
    };
    return labels[status] ?? status;
}

/**
 * Store/marker status to human-readable label.
 */
export function markerStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        online: 'Semua kamera online',
        partial: 'Sebagian kamera bermasalah',
        offline: 'Semua kamera offline',
        unknown: 'Status tidak diketahui',
    };
    return labels[status] ?? status;
}
