<?php

namespace App\Services;

use App\Models\Camera;
use App\Models\PlaybackSession;
use App\Models\User;
use App\Services\CameraAdapters\YouTubeLiveSourceAdapter;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class PlaybackService
{
    /** Max concurrent active video streams per user to prevent network saturation */
    public const MAX_CONCURRENT_SESSIONS = 9;

    /**
     * Authorize and start a new playback session for a camera.
     *
     * @throws AccessDeniedHttpException
     */
    public function createSession(User $user, Camera $camera, string $preferredProtocol = 'webrtc'): PlaybackSession
    {
        // 1. Authorization checks
        if (! $user->isActive()) {
            throw new AccessDeniedHttpException('Akun pengguna tidak aktif.');
        }

        if (! $user->hasPermission('cameras.live_view')) {
            throw new AccessDeniedHttpException('Anda tidak memiliki izin untuk menonton live stream kamera.');
        }

        // 2. Store Scope check (anti-IDOR defense)
        if (! $user->canAccessStore($camera->store_id)) {
            throw new AccessDeniedHttpException('Akses ditolak: Kamera ini berada di luar cakupan store Anda.');
        }

        // 3. Camera status check
        if (! $camera->is_active) {
            throw new UnprocessableEntityHttpException('Kamera ini sedang dalam status nonaktif.');
        }

        // 4. Concurrency control: auto-release oldest sessions if limit exceeded
        $activeSessions = PlaybackSession::where('user_id', $user->id)
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->oldest('started_at')
            ->get();

        if ($activeSessions->count() >= self::MAX_CONCURRENT_SESSIONS) {
            // Release the oldest session
            $oldest = $activeSessions->first();
            $oldest?->update([
                'status' => 'released',
                'ended_at' => now(),
            ]);
        }

        // 5. Build scoped playback session
        $sessionId = (string) Str::uuid();
        $token = bin2hex(random_bytes(32));

        if ($camera->connection_type === 'youtube_live') {
            $protocol = 'youtube_live';
            $primarySource = $camera->primarySource;
            $embedUrl = null;
            if ($primarySource && ! empty($primarySource->source_config_encrypted)) {
                try {
                    $config = json_decode(Crypt::decryptString($primarySource->source_config_encrypted), true);
                    $url = $config['url'] ?? $config['video_id'] ?? '';
                    $adapter = new YouTubeLiveSourceAdapter;
                    $videoId = $adapter->extractVideoId((string) $url);
                    if ($videoId) {
                        $embedUrl = $adapter->getEmbedUrl($videoId);
                    }
                } catch (\Throwable) {
                    // Fallback to placeholder if decryption fails
                }
            }
            $playbackUrl = $embedUrl ?: 'https://www.youtube-nocookie.com/embed/live_stream';
        } else {
            // Output protocol selection: WebRTC target, HLS fallback
            $protocol = in_array($preferredProtocol, ['webrtc', 'hls', 'mjpeg'], true)
                ? $preferredProtocol
                : 'webrtc';

            // Browser playback URL (safe, scoped token only, NEVER raw RTSP/source credentials)
            $playbackUrl = url("/playback/stream/{$token}");
        }

        return PlaybackSession::create([
            'session_id' => $sessionId,
            'camera_id' => $camera->id,
            'user_id' => $user->id,
            'gateway_id' => $camera->gateway_id,
            'output_protocol' => $protocol,
            'session_token' => $token,
            'playback_url' => $playbackUrl,
            'started_at' => now(),
            'expires_at' => now()->addMinutes(30),
            'status' => 'active',
        ]);
    }

    /**
     * Extend a session's expiration time (heartbeat lease).
     */
    public function heartbeat(string $sessionId, User $user): PlaybackSession
    {
        $session = PlaybackSession::where('session_id', $sessionId)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (! $session) {
            throw new NotFoundHttpException('Sesi pemutaran tidak ditemukan atau telah kedaluwarsa.');
        }

        // Extend lease by 15 minutes
        $session->update([
            'expires_at' => now()->addMinutes(15),
        ]);

        return $session;
    }

    /**
     * Explicitly release a session when closed or component unmounts.
     */
    public function release(string $sessionId, User $user): void
    {
        PlaybackSession::where('session_id', $sessionId)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->update([
                'status' => 'released',
                'ended_at' => now(),
            ]);
    }
}
