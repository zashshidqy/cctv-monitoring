<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class AuditService
{
    /**
     * Log an administrative or security-sensitive action.
     * All secrets and sensitive attributes MUST be redacted before logging.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function log(
        string $action,
        ?User $actor = null,
        ?string $subjectType = null,
        ?int $subjectId = null,
        array $metadata = []
    ): ActivityLog {
        // Redact potential secret keys
        $redactedMetadata = $this->redactSecrets($metadata);

        return ActivityLog::create([
            'actor_user_id' => $actor?->id ?? auth()->id(),
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'ip_hash' => request()->ip() ? hash('sha256', request()->ip()) : null,
            'metadata' => empty($redactedMetadata) ? null : $redactedMetadata,
            'occurred_at' => now(),
        ]);
    }

    /**
     * Redact sensitive keys from metadata payload recursively.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function redactSecrets(array $data): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'token',
            'secret',
            'rtsp_url',
            'source_url',
            'key',
            'credential',
        ];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->redactSecrets($value);
            } elseif (in_array(strtolower((string) $key), $sensitiveKeys, true)) {
                $data[$key] = '[REDACTED]';
            }
        }

        return $data;
    }
}
