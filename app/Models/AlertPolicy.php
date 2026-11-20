<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlertPolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'role',
        'alert_level',
        'allowed_types',
        'require_approval',
        'deduplication_minutes',
        'enabled',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'allowed_types' => 'array',
            'require_approval' => 'boolean',
            'deduplication_minutes' => 'integer',
            'enabled' => 'boolean',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the default policy for a given role.
     */
    public static function getForRole(string $role): ?self
    {
        return static::where('role', $role)
            ->where('enabled', true)
            ->first();
    }

    /**
     * Check if a given alert level is allowed by this policy.
     */
    public function allowsLevel(string $level): bool
    {
        if (! $this->alert_level) {
            return true; // No restriction
        }

        return $this->alert_level === $level;
    }

    /**
     * Check if a given alert type is allowed by this policy.
     */
    public function allowsType(string $type): bool
    {
        if (! $this->allowed_types || empty($this->allowed_types)) {
            return true; // No restriction
        }

        return in_array($type, $this->allowed_types, true);
    }

    /**
     * Check if this policy allows the alert based on level and type.
     */
    public function allowsAlert(string $level, string $type): bool
    {
        return $this->allowsLevel($level) && $this->allowsType($type);
    }

    /**
     * Scope to filter policies by role.
     */
    public function scopeForRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope to filter enabled policies.
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }
}
