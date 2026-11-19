<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CameraSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'camera_id',
        'source_kind',
        'source_config_encrypted',
        'is_primary',
        'is_active',
        'created_by',
    ];

    protected $hidden = [
        'source_config_encrypted', // Never leak encrypted or raw payload in serialization
    ];

    protected function casts(): array
    {
        return [
            'source_config_encrypted' => 'encrypted:array',
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get sanitized diagnostic representation (no passwords or secret keys).
     *
     * @return array<string, mixed>
     */
    public function getSanitizedConfig(): array
    {
        $config = $this->source_config_encrypted ?? [];

        // Redact password or secret fields
        if (isset($config['password'])) {
            $config['password'] = '********';
        }
        if (isset($config['token'])) {
            $config['token'] = '********';
        }

        return $config;
    }
}
