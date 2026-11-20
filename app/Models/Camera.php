<?php

namespace App\Models;

use App\CameraStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Camera extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'gateway_id',
        'code',
        'name',
        'area_label',
        'channel_number',
        'device_type',
        'connection_type',
        'status',
        'is_active',
        'last_checked_at',
        'last_success_at',
        'deactivated_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'channel_number' => 'integer',
            'last_checked_at' => 'datetime',
            'last_success_at' => 'datetime',
            'deactivated_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function gateway(): BelongsTo
    {
        return $this->belongsTo(Gateway::class);
    }

    public function sources(): HasMany
    {
        return $this->hasMany(CameraSource::class);
    }

    public function primarySource(): HasOne
    {
        return $this->hasOne(CameraSource::class)->where('is_primary', true);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOnline(Builder $query): Builder
    {
        return $query->where('status', CameraStatus::Online->value);
    }
}
