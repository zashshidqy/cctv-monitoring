<?php

namespace App\Services\CameraAdapters;

class CameraAdapterManager
{
    /**
     * @var array<string, CameraSourceAdapterInterface>
     */
    protected array $adapters = [];

    public function __construct()
    {
        $this->adapters = [
            'rtsp' => new RtspSourceAdapter,
            'onvif' => new OnvifSourceAdapter,
            'nvr_channel' => new RtspSourceAdapter,
            'dvr_channel' => new RtspSourceAdapter,
            'hls' => new HlsSourceAdapter,
            'webrtc' => new WebRtcSourceAdapter,
            'snapshot' => new SnapshotSourceAdapter,
            'mjpeg' => new SnapshotSourceAdapter,
            'youtube_live' => new YouTubeLiveSourceAdapter,
            'youtube' => new YouTubeLiveSourceAdapter,
        ];
    }

    /**
     * Get adapter for connection type.
     */
    public function getAdapter(string $connectionType): CameraSourceAdapterInterface
    {
        $key = strtolower($connectionType);

        if (! isset($this->adapters[$key])) {
            // Default to RTSP adapter
            return $this->adapters['rtsp'];
        }

        return $this->adapters[$key];
    }
}
