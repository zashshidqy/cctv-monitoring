<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CameraAlert extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'level',
        'camera_id',
        'store_id',
        'type',
        'summary',
        'failure_count',
        'is_resolved',
        'recovered_at',
        'first_fired_at',
        'last_fired_at',
        'approved_by_user_id',
        'approved_at',
        'approval_status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'string',
            'camera_id' => 'integer',
            'store_id' => 'integer',
            'failure_count' => 'integer',
            'is_resolved' => 'boolean',
            'recovered_at' => 'datetime',
            'first_fired_at' => 'datetime',
            'last_fired_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_resolved', false);
    }

    public function scopePendingApproval(Builder $query): Builder
    {
        return $query->where('approval_status', 'pending');
    }

    public function scopeByStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeWarning(Builder $query): Builder
    {
        return $query->where('level', 'warning');
    }

    public function scopeCritical(Builder $query): Builder
    {
        return $query->where('level', 'critical');
    }

    public function markAsApproved(User $user): void
    {
        $this->update([
            'approved_by_user_id' => $user->id,
            'approved_at' => now(),
            'approval_status' => 'approved',
            'is_resolved' => false, // Pending follow-up action
        ]);
    }

    public function markAsRejected(): void
    {
        $this->update([
            'approved_at' => now(),
            'approval_status' => 'rejected',
            'is_resolved' => false,
        ]);
    }

    public function markAsResolved(): void
    {
        $this->update([
            'is_resolved' => true,
            'recovered_at' => now(),
            'approved_at' => now(),
            'approval_status' => 'approved',
        ]);
    }
}
