<?php

namespace App;

enum UserStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Locked = 'locked';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Aktif',
            self::Inactive => 'Nonaktif',
            self::Locked => 'Terkunci',
        };
    }

    public function canLogin(): bool
    {
        return $this === self::Active;
    }
}
