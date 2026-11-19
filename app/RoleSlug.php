<?php

namespace App;

enum RoleSlug: string
{
    case MasterAdmin = 'master_admin';
    case Gm = 'gm';
    case Sv = 'sv';
    case Staff = 'staff';

    /** Human-readable label (Bahasa Indonesia). */
    public function label(): string
    {
        return match ($this) {
            self::MasterAdmin => 'Master Admin',
            self::Gm => 'General Manager',
            self::Sv => 'Supervisor',
            self::Staff => 'Staff',
        };
    }

    /** Whether this role has global store scope (all active stores). */
    public function hasGlobalScope(): bool
    {
        return match ($this) {
            self::MasterAdmin, self::Gm => true,
            default => false,
        };
    }
}
