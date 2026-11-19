<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MonitoringController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Monitoring Map (default authenticated landing page)
    Route::get('/', function () {
        return redirect()->route('monitoring.index');
    });

    Route::prefix('monitoring')->name('monitoring.')->group(function () {
        Route::get('/', [MonitoringController::class, 'index'])->name('index');
        Route::get('/stores/geojson', [MonitoringController::class, 'storesGeoJson'])->name('stores.geojson');
    });

    // Admin routes (Master Admin only by default)
    Route::prefix('admin')->name('admin.')->middleware('role:master_admin')->group(function () {
        Route::get('/', function () {
            return Inertia::render('admin/overview');
        })->name('overview');
    });
});
