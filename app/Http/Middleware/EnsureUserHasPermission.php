<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * Handle an incoming request.
     * Usage: middleware('permission:monitoring.view')
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isActive()) {
            abort(403, 'Akses ditolak: Akun tidak aktif atau belum masuk.');
        }

        if (! $user->hasPermission($permission)) {
            abort(403, "Akses ditolak: Anda tidak memiliki izin [{$permission}].");
        }

        return $next($request);
    }
}
