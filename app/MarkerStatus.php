<?php

namespace App;

enum MarkerStatus: string
{
    case Online = 'online';
    case Partial = 'partial';
    case Offline = 'offline';
    case Unknown = 'unknown';

    public function label(): string
    {
        return match ($this) {
            self::Online => 'Semua kamera online',
            self::Partial => 'Sebagian kamera bermasalah',
            self::Offline => 'Semua kamera offline',
            self::Unknown => 'Status tidak diketahui',
        };
    }
}
