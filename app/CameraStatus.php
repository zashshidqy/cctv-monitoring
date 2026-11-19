<?php

namespace App;

enum CameraStatus: string
{
    case Online = 'online';
    case Unstable = 'unstable';
    case Offline = 'offline';
    case Unknown = 'unknown';

    public function label(): string
    {
        return match ($this) {
            self::Online => 'Online',
            self::Unstable => 'Tidak Stabil',
            self::Offline => 'Offline',
            self::Unknown => 'Tidak Diketahui',
        };
    }
}
