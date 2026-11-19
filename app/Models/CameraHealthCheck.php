<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CameraHealthCheck extends Model
{
    use HasFactory;

    protected $fillable = [
        'camera_id',
        'protocol',
        'latency_ms',
        'result',
        'diagnostics',
        'probed_at',
    ];

    protected function casts(): array
    {
        return [
            'latency_ms' => 'integer',
            'diagnostics' => 'array',
            'probed_at' => 'datetime',
        ];
    }

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    public function scopeRecent(Builder $query, int $minutes = 30): Builder
    {
        return $query->where('probed_at', '>=', now()->subMinutes($minutes));
    }

    public function scopeByResult(Builder $query, string $result): Builder
    {
        return $query->where('result', $result);
    }
}
