<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of system activity logs.
     */
    public function index(Request $request): Response
    {
        $query = ActivityLog::with('actor')->latest('occurred_at');

        if ($action = $request->query('action')) {
            $query->where('action', 'like', "%{$action}%");
        }

        $logs = $query->paginate(20)->withQueryString();

        return Inertia::render('admin/logs/index', [
            'logs' => $logs->through(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'actor' => $log->actor ? [
                    'id' => $log->actor->id,
                    'name' => $log->actor->name,
                    'email' => $log->actor->email,
                ] : null,
                'subjectType' => class_basename((string) $log->subject_type),
                'subjectId' => $log->subject_id,
                'metadata' => $log->metadata,
                'occurredAt' => $log->occurred_at->toIso8601String(),
            ]),
            'filters' => [
                'action' => $request->query('action', ''),
            ],
        ]);
    }
}
