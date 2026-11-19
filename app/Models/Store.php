<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'address',
        'city',
        'region',
        'postal_code',
        'latitude',
        'longitude',
        'status',
        'notes',
        'deactivated_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'deactivated_at' => 'datetime',
        ];
    }

    public function userAssignments(): HasMany
    {
        return $this->hasMany(StoreUserAssignment::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'store_user_assignments')
            ->withPivot(['status', 'starts_at', 'ends_at'])
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
