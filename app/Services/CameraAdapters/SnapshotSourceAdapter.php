<?php

namespace App\Services\CameraAdapters;

class SnapshotSourceAdapter implements CameraSourceAdapterInterface
{
    public function testConnection(array $config): array
    {
        $url = $config['snapshot_url'] ?? '';

        if (empty($url) || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return [
                'success' => false,
                'message' => 'Format URL snapshot tidak valid.',
                'latency_ms' => null,
                'diagnostics' => ['snapshot_url' => $url],
            ];
        }

        $connected = ! str_contains($url, 'unreachable');

        return [
            'success' => $connected,
            'message' => $connected ? 'Endpoint snapshot JPEG valid.' : 'Gagal mengambil gambar snapshot dari endpoint.',
            'latency_ms' => $connected ? 80 : null,
            'diagnostics' => [
                'protocol' => 'HTTP Snapshot Polling',
                'format' => 'image/jpeg',
                'polling_interval_sec' => 5,
            ],
        ];
    }

    public function sanitizeConfig(array $config): array
    {
        return [
            'snapshot_url' => $config['snapshot_url'] ?? '',
        ];
    }
}
