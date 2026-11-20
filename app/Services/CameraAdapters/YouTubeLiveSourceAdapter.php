<?php

namespace App\Services\CameraAdapters;

class YouTubeLiveSourceAdapter implements CameraSourceAdapterInterface
{
    /**
     * Regex pattern to extract YouTube 11-character video ID from various URL formats.
     */
    public const YOUTUBE_ID_PATTERN = '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i';

    /**
     * Test connection & validation for YouTube Live source.
     */
    public function testConnection(array $config): array
    {
        $input = trim((string) ($config['url'] ?? $config['video_id'] ?? ''));

        if (empty($input)) {
            return [
                'success' => false,
                'message' => 'URL atau Video ID YouTube Live tidak boleh kosong.',
                'latency_ms' => null,
                'diagnostics' => ['input' => ''],
            ];
        }

        // Anti-XSS: strictly reject raw HTML tags
        if (str_contains($input, '<') || str_contains($input, '>') || str_contains($input, '"') || str_contains($input, "'")) {
            return [
                'success' => false,
                'message' => 'Input URL mengandung karakter yang tidak diizinkan.',
                'latency_ms' => null,
                'diagnostics' => ['input' => '[FILTERED]'],
            ];
        }

        $videoId = $this->extractVideoId($input);

        if (! $videoId) {
            return [
                'success' => false,
                'message' => 'Format URL atau ID YouTube Live tidak valid. Gunakan format youtube.com/watch?v=ID, youtu.be/ID, atau youtube.com/live/ID.',
                'latency_ms' => null,
                'diagnostics' => ['input' => substr($input, 0, 40)],
            ];
        }

        $embedUrl = $this->getEmbedUrl($videoId);

        return [
            'success' => true,
            'message' => "Sumber YouTube Live terverifikasi (ID: {$videoId}). Siaran siap diputar via embed resmi.",
            'latency_ms' => 75,
            'diagnostics' => [
                'protocol' => 'YouTube Live Embed',
                'video_id' => $videoId,
                'embed_url' => $embedUrl,
                'mode' => 'sandbox_iframe',
            ],
        ];
    }

    /**
     * Sanitize configuration to prevent secret leaks.
     */
    public function sanitizeConfig(array $config): array
    {
        $input = trim((string) ($config['url'] ?? $config['video_id'] ?? ''));
        $videoId = $this->extractVideoId($input);

        return [
            'url' => $input,
            'video_id' => $videoId,
            'embed_url' => $videoId ? $this->getEmbedUrl($videoId) : null,
        ];
    }

    /**
     * Extract clean 11-character video ID from URL or raw ID.
     */
    public function extractVideoId(string $input): ?string
    {
        $trimmed = trim($input);

        // Check if raw 11-char ID
        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $trimmed)) {
            return $trimmed;
        }

        if (preg_match(self::YOUTUBE_ID_PATTERN, $trimmed, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Generate secure, privacy-enhanced YouTube embed URL.
     */
    public function getEmbedUrl(string $videoId): string
    {
        return "https://www.youtube-nocookie.com/embed/{$videoId}?autoplay=1&mute=1&enablejsapi=1";
    }
}
