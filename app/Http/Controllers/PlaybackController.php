<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use App\Models\PlaybackSession;
use App\Services\PlaybackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PlaybackController extends Controller
{
    public function __construct(
        protected PlaybackService $playbackService
    ) {}

    /**
     * Create an authorized, short-lived playback session for a camera.
     */
    public function startSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'camera_id' => ['required', 'exists:cameras,id'],
            'protocol' => ['nullable', 'in:webrtc,hls,mjpeg,youtube_live'],
        ]);

        $camera = Camera::findOrFail($validated['camera_id']);

        $session = $this->playbackService->createSession(
            user: $request->user(),
            camera: $camera,
            preferredProtocol: $validated['protocol'] ?? 'webrtc'
        );

        return response()->json([
            'sessionId' => $session->session_id,
            'cameraId' => $session->camera_id,
            'protocol' => $session->output_protocol,
            'playbackUrl' => $session->playback_url,
            'expiresAt' => $session->expires_at->toIso8601String(),
        ]);
    }

    /**
     * Extend playback session lease.
     */
    public function heartbeat(Request $request, string $sessionId): JsonResponse
    {
        $session = $this->playbackService->heartbeat($sessionId, $request->user());

        return response()->json([
            'sessionId' => $session->session_id,
            'expiresAt' => $session->expires_at->toIso8601String(),
            'status' => $session->status,
        ]);
    }

    /**
     * Explicitly close/release a playback session.
     */
    public function release(Request $request, string $sessionId): JsonResponse
    {
        $this->playbackService->release($sessionId, $request->user());

        return response()->json(['released' => true]);
    }

    /**
     * Authorized stream frame endpoint (SVG/image feed with CCTV watermark).
     */
    public function streamFeed(string $token): Response
    {
        $session = PlaybackSession::with('camera.store')
            ->where('session_token', $token)
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->first();

        if (! $session) {
            abort(403, 'Sesi stream tidak valid atau telah berakhir.');
        }

        $cam = $session->camera;
        $store = $cam->store;
        $time = now()->format('Y-m-d H:i:s');

        // Dynamic clean CCTV video stream mockup SVG
        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect width="640" height="360" fill="#15191D"/>
    <!-- Subtle perspective floor grid -->
    <path d="M 0 260 L 640 260 M 0 310 L 640 310 M 200 200 L 0 360 M 320 200 L 240 360 M 320 200 L 400 360 M 440 200 L 640 360" stroke="#252A30" stroke-width="1"/>
    <!-- Camera feed identifier HUD -->
    <rect x="16" y="16" width="8" height="8" rx="4" fill="#E60012"/>
    <text x="32" y="24" fill="#FFFFFF" font-family="monospace" font-size="12" font-weight="bold">LIVE</text>
    <text x="80" y="24" fill="#E0E4E8" font-family="monospace" font-size="11">O!SAVE CCTV MONITOR</text>
    <!-- Store & Camera info -->
    <text x="16" y="336" fill="#FFFFFF" font-family="monospace" font-size="12" font-weight="bold">{$cam->name} [{$cam->code}]</text>
    <text x="16" y="320" fill="#A0AAB5" font-family="sans-serif" font-size="10">{$store->name} • {$cam->area_label}</text>
    <!-- Timestamp watermark -->
    <text x="490" y="24" fill="#E0E4E8" font-family="monospace" font-size="11">{$time}</text>
    <!-- Crosshair indicator -->
    <line x1="310" y1="180" x2="330" y2="180" stroke="#68727D" stroke-width="1"/>
    <line x1="320" y1="170" x2="320" y2="190" stroke="#68727D" stroke-width="1"/>
</svg>
SVG;

        return response($svg, 200, [
            'Content-Type' => 'image/svg+xml',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }
}
