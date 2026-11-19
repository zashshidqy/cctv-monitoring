<?php

namespace App\Models;

use App\RoleSlug;
use App\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'status',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function storeAssignments(): HasMany
    {
        return $this->hasMany(StoreUserAssignment::class);
    }

    public function assignedStores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class, 'store_user_assignments')
            ->wherePivot('status', 'active')
            ->withPivot(['status', 'starts_at', 'ends_at'])
            ->withTimestamps();
    }

    public function isMasterAdmin(): bool
    {
        return $this->role?->slug === RoleSlug::MasterAdmin->value;
    }

    public function isGm(): bool
    {
        return $this->role?->slug === RoleSlug::Gm->value;
    }

    public function isSv(): bool
    {
        return $this->role?->slug === RoleSlug::Sv->value;
    }

    public function isStaff(): bool
    {
        return $this->role?->slug === RoleSlug::Staff->value;
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active->value;
    }

    /**
     * Check if user has a permission.
     * Master Admin has all permissions.
     * Others check role permissions + user-specific overrides.
     */
    public function hasPermission(string $slug): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        if ($this->isMasterAdmin()) {
            return true;
        }

        // Check user explicit override first
        $override = \DB::table('user_permissions')
            ->join('permissions', 'permissions.id', '=', 'user_permissions.permission_id')
            ->where('user_permissions.user_id', $this->id)
            ->where('permissions.slug', $slug)
            ->select('user_permissions.effect')
            ->first();

        if ($override) {
            return $override->effect === 'grant';
        }

        // Check role permissions
        return $this->role?->permissions()->where('slug', $slug)->exists() ?? false;
    }

    /**
     * Return all effective permission slugs.
     *
     * @return string[]
     */
    public function getPermissionSlugs(): array
    {
        if (! $this->isActive()) {
            return [];
        }

        if ($this->isMasterAdmin()) {
            return Permission::pluck('slug')->all();
        }

        $rolePermissions = $this->role?->permissions()->pluck('slug')->all() ?? [];

        // Apply user overrides
        $grants = \DB::table('user_permissions')
            ->join('permissions', 'permissions.id', '=', 'user_permissions.permission_id')
            ->where('user_permissions.user_id', $this->id)
            ->where('user_permissions.effect', 'grant')
            ->pluck('permissions.slug')
            ->all();

        $denies = \DB::table('user_permissions')
            ->join('permissions', 'permissions.id', '=', 'user_permissions.permission_id')
            ->where('user_permissions.user_id', $this->id)
            ->where('user_permissions.effect', 'deny')
            ->pluck('permissions.slug')
            ->all();

        $merged = array_unique(array_merge($rolePermissions, $grants));

        return array_values(array_diff($merged, $denies));
    }

    /**
     * Get accessible store IDs.
     * Returns null if user has global scope (Master Admin & GM).
     * Returns array of store IDs for SV & Staff.
     *
     * @return int[]|null
     */
    public function getStoreScopeIds(): ?array
    {
        if ($this->isMasterAdmin() || $this->isGm()) {
            return null; // Global scope
        }

        return $this->assignedStores()->pluck('stores.id')->all();
    }

    /**
     * Check if user can access a specific store.
     */
    public function canAccessStore(int|Store $store): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        $storeId = $store instanceof Store ? $store->id : $store;

        $scope = $this->getStoreScopeIds();

        // null means global access to all active stores
        if ($scope === null) {
            return Store::where('id', $storeId)->where('status', 'active')->exists();
        }

        return in_array($storeId, $scope, true);
    }
}
