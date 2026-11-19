<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\UserStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Show the login view.
     */
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->intended(route('monitoring.index'));
        }

        return Inertia::render('auth/login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            // Generic error message — do not reveal whether the email exists (security requirement)
            throw ValidationException::withMessages([
                'email' => __('Kombinasi email dan kata sandi tidak cocok.'),
            ]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        // Check if account is active
        if ($user->status !== UserStatus::Active->value) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => __('Akun Anda sedang dinonaktifkan atau dikunci. Hubungi Master Admin.'),
            ]);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        return redirect()->intended(route('monitoring.index'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
