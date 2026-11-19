<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     * Usage: middleware('role:master_admin,gm')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isActive()) {
            abort(403, 'Akses ditolak: Akun tidak aktif atau belum masuk.');
        }

        if (! in_array($user->role?->slug, $roles, true)) {
            abort(403, 'Akses ditolak: Peran Anda tidak memiliki izin untuk halaman ini.');
        }

        return $next($request);
    }
}
