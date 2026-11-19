/**
 * O!Save Monitor — Domain types
 * Generated: Epic 1 Foundation
 */

// ─── Auth / User ─────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive' | 'locked';

export type RoleSlug = 'master_admin' | 'gm' | 'sv' | 'staff';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    status: UserStatus;
    role: RoleSlug;
    permissions: string[];
    /** Store IDs this user can access. null = global (master_admin / gm) */
    storeScope: number[] | null;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export type StoreStatus = 'active' | 'inactive';

export type MarkerStatus = 'online' | 'partial' | 'offline' | 'unknown';

export interface Store {
    id: number;
    code: string;
    name: string;
    address: string;
    city: string;
    region: string;
    latitude: number;
    longitude: number;
    status: StoreStatus;
    notes: string | null;
}

export interface StoreMarkerData {
    id: number;
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    markerStatus: MarkerStatus;
    cameraTotal: number;
    cameraOnline: number;
    cameraUnstable: number;
    cameraOffline: number;
    cameraUnknown: number;
}

// ─── Camera ──────────────────────────────────────────────────────────────────

export type CameraStatus = 'online' | 'unstable' | 'offline' | 'unknown';

export type ConnectionType =
    | 'onvif'
    | 'rtsp'
    | 'hls'
    | 'webrtc'
    | 'mjpeg'
    | 'snapshot'
    | 'vendor'
    | 'custom';

export type DeviceType = 'ip_camera' | 'nvr_channel' | 'dvr_channel' | 'other';

export type PreviewType = 'snapshot' | 'unavailable' | 'none';

export interface Camera {
    id: number;
    storeId: number;
    code: string;
    name: string;
    areaLabel: string;
    deviceType: DeviceType;
    connectionType: ConnectionType;
    status: CameraStatus;
    isActive: boolean;
    lastCheckedAt: string | null;
    lastSuccessAt: string | null;
}

export interface CameraCardData extends Camera {
    previewType: PreviewType;
    /** Short-lived authorized snapshot URL — never raw RTSP/source URL */
    snapshotUrl: string | null;
    snapshotTakenAt: string | null;
    isSelected: boolean;
}

// ─── Playback ─────────────────────────────────────────────────────────────────

export type PlaybackProtocol = 'webrtc' | 'hls' | 'mjpeg';

export type PlaybackState =
    | 'idle'
    | 'preparing'
    | 'connecting'
    | 'playing'
    | 'reconnecting'
    | 'offline'
    | 'unsupported'
    | 'error';

export interface PlaybackSession {
    sessionId: string;
    cameraId: number;
    protocol: PlaybackProtocol;
    /** Short-lived playback URL/token — never raw source URL */
    playbackUrl: string;
    expiresAt: string;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export type AlertStatus = 'active' | 'acknowledged' | 'recovered' | 'closed';

export type AlertType = 'camera_offline' | 'camera_unstable' | 'gateway_offline';

export interface Alert {
    id: number;
    storeId: number;
    storeName: string;
    cameraId: number | null;
    cameraName: string | null;
    alertType: AlertType;
    status: AlertStatus;
    firstDetectedAt: string;
    lastDetectedAt: string;
    recoveredAt: string | null;
}

// ─── Shared ──────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

// ─── Inertia page props ───────────────────────────────────────────────────────

export interface SharedProps {
    [key: string]: unknown;
    auth: {
        user: AuthUser | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
    unreadAlertCount: number;
}
