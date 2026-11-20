<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gateway extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'type',
        'store_id',
        'host',
        'port',
        'status',
        'version',
        'last_heartbeat_at',
        'metadata',
        'notes',
        'deactivated_at',
    ];

    protected function casts(): array
    {
        return [
            'port' => 'integer',
            'last_heartbeat_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('deactivated_at');
    }

    public function scopeOnline(Builder $query): Builder
    {
        return $query->where('status', 'online');
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function isCentral(): bool
    {
        return $this->type === 'central';
    }

    public function isEdge(): bool
    {
        return $this->type === 'edge';
    }
}
