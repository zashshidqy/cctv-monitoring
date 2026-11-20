<?php

namespace App\Http\Controllers;

use App\Models\AlertPolicy;
use App\Models\CameraAlert;
use App\Models\CameraHealthCheck;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CameraAlertController extends Controller
{
    public function __construct(
        private CameraAlertService $alertService,
    ) {}

    /**
     * Get grouped alert summary for a user (new, active, resolved, history).
     * Returns count and list of alerts grouped by store.
     * Applies role-based alert policies and store scope.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Extract filters from request
        $filters = [
            'status' => $request->query('status'), // active, resolved, pending
            'level' => $request->query('level'),   // warning, critical
            'type' => $request->query('type'),     // offline, unstable_connection, etc.
            'store_id' => $request->query('store_id'),
            'per_page' => $request->input('per_page', 15),
        ];

        // Use service method that applies role-based policies
        $result = $this->alertService->getAlertsForUser($user, $filters);

        return response()->json($result);
    }

    /**
     * Get detailed alert information including health check history.
     */
    public function show(int $id): JsonResponse
    {
        $alert = CameraAlert::with(['store', 'camera'])->findOrFail($id);

        $user = request()->user();

        // Apply store scope check for non-master_admin
        if (! $user->hasRole('master_admin')) {
            $userStoreIds = $user->storeAssignments()->pluck('store_id');
            if (! $userStoreIds->contains($alert->store_id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        // Check if user's policy allows viewing this alert type/level
        $roles = $user->getRoleNames()->toArray();
        $canView = false;

        foreach ($roles as $role) {
            $policy = AlertPolicy::getForRole($role);
            if ($policy && $policy->allowsAlert($alert->level, $alert->type)) {
                $canView = true;
                break;
            }
        }

        // Also check master_admin
        $masterPolicy = AlertPolicy::getForRole('master_admin');
        if ($masterPolicy && $masterPolicy->allowsAlert($alert->level, $alert->type)) {
            $canView = true;
        }

        if (! $canView && ! $user->hasRole('master_admin')) {
            return response()->json(['error' => 'Alert type not visible per your role policy'], 403);
        }

        $healthHistory = CameraHealthCheck::recent($alert->camera_id)
            ->orderBy('probed_at', 'desc')
            ->take(10)
            ->get(['id', 'result', 'latency_ms', 'probed_at']);

        return response()->json([
            'alert' => [
                'id' => $alert->id,
                'level' => $alert->level,
                'type' => $alert->type,
                'summary' => $alert->summary,
                'failure_count' => $alert->failure_count,
                'is_resolved' => $alert->is_resolved,
                'recovered_at' => $alert->recovered_at?->toIso8601String(),
                'first_fired_at' => $alert->first_fired_at->toIso8601String(),
                'last_fired_at' => $alert->last_fired_at->toIso8601String(),
                'approval_status' => $alert->approval_status,
                'approved_by_user_id' => $alert->approved_by_user_id,
                'store_id' => $alert->store_id,
                'camera_id' => $alert->camera_id,
            ],
            'store' => [
                'id' => $alert->store_id,
                'name' => $alert->store->name,
                'code' => $alert->store->code,
            ],
            'camera' => [
                'id' => $alert->camera_id,
                'name' => $alert->camera->name,
                'code' => $alert->camera->code,
                'status' => $alert->camera->status,
            ],
            'health_history' => $healthHistory,
        ]);
    }

    /**
     * Request approval for an alert (GM/SV action).
     */
    public function approve(int $id): JsonResponse
    {
        $alert = CameraAlert::with('store')->findOrFail($id);
        $user = request()->user();

        // Authorization: Only GM/SV role can approve
        if (! $user->hasAnyRole('gm', 'sv')) {
            return response()->json(['error' => 'Only GM/SV can approve alerts'], 403);
        }

        // Apply store scope check
        $userStoreIds = $user->storeAssignments()->pluck('store_id');
        if (! $userStoreIds->contains($alert->store_id)) {
            return response()->json(['error' => 'Alert not in your scope'], 403);
        }

        // Check if policy requires approval for this role
        $roles = $user->getRoleNames()->toArray();
        $requiresApproval = false;
        foreach ($roles as $role) {
            $policy = AlertPolicy::getForRole($role);
            if ($policy && $policy->require_approval) {
                $requiresApproval = true;
                break;
            }
        }

        if (! $requiresApproval && ! $user->hasRole('master_admin')) {
            return response()->json(['error' => 'Your role does not require approval for alerts'], 403);
        }

        // Mark as approved
        $alert->markAsApproved($user);

        Log::info("CameraAlertController: Alert {$alert->id} approved by user {$user->email} for store {$alert->store->code}");

        return response()->json([
            'approved' => true,
            'action' => 'approved',
            'approved_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Reject an alert (GM/SV action).
     */
    public function reject(int $id): JsonResponse
    {
        $alert = CameraAlert::with('store')->findOrFail($id);
        $user = request()->user();

        // Authorization: Only GM/SV role can reject
        if (! $user->hasAnyRole('gm', 'sv')) {
            return response()->json(['error' => 'Only GM/SV can reject alerts'], 403);
        }

        // Apply store scope check
        $userStoreIds = $user->storeAssignments()->pluck('store_id');
        if (! $userStoreIds->contains($alert->store_id)) {
            return response()->json(['error' => 'Alert not in your scope'], 403);
        }

        // Check if policy requires approval for this role
        $roles = $user->getRoleNames()->toArray();
        $requiresApproval = false;
        foreach ($roles as $role) {
            $policy = AlertPolicy::getForRole($role);
            if ($policy && $policy->require_approval) {
                $requiresApproval = true;
                break;
            }
        }

        if (! $requiresApproval && ! $user->hasRole('master_admin')) {
            return response()->json(['error' => 'Your role does not require approval for alerts'], 403);
        }

        // Mark as rejected
        $alert->markAsRejected();

        Log::info("CameraAlertController: Alert {$alert->id} rejected by user {$user->email} for store {$alert->store->code}");

        return response()->json([
            'rejected' => true,
            'action' => 'rejected',
            'rejected_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get unread alert count for notification badge (lightweight endpoint).
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $filters = [
            'status' => 'active',
        ];

        $result = $this->alertService->getAlertsForUser($user, $filters);

        return response()->json([
            'count' => $result['summary']['new'] + $result['summary']['active'],
            'new' => $result['summary']['new'],
            'active' => $result['summary']['active'],
        ]);
    }
}
