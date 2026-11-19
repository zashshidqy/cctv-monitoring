<?php

namespace App\Services\CameraAdapters;

interface CameraSourceAdapterInterface
{
    /**
     * Test reachability and validation of camera source credentials.
     * Must NEVER return plain passwords in the output.
     *
     * @param  array<string, mixed>  $config
     * @return array{
     *     success: bool,
     *     message: string,
     *     latency_ms: int|null,
     *     diagnostics: array<string, mixed>
     * }
     */
    public function testConnection(array $config): array;

    /**
     * Return configuration stripped of all secrets.
     *
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function sanitizeConfig(array $config): array;
}
