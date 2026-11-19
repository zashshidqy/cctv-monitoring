<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CameraController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\PlaybackController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\UserController;
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

    // Playback Session & Stream Endpoints (Epic 5)
    Route::prefix('playback')->name('playback.')->middleware('auth')->group(function () {
        Route::post('/sessions', [PlaybackController::class, 'startSession'])->name('sessions.start');
        Route::post('/sessions/{sessionId}/heartbeat', [PlaybackController::class, 'heartbeat'])->name('sessions.heartbeat');
        Route::post('/sessions/{sessionId}/release', [PlaybackController::class, 'release'])->name('sessions.release');
        Route::get('/stream/{token}', [PlaybackController::class, 'streamFeed'])->name('stream.feed');
    });

    // Admin routes (Master Admin only by default)
    Route::prefix('admin')->name('admin.')->middleware('role:master_admin')->group(function () {
        Route::get('/', function () {
            return Inertia::render('admin/overview');
        })->name('overview');

        // Store Management (Epic 3)
        Route::get('/stores', [StoreController::class, 'index'])->name('stores.index');
        Route::post('/stores', [StoreController::class, 'store'])->name('stores.store');
        Route::put('/stores/{store}', [StoreController::class, 'update'])->name('stores.update');
        Route::delete('/stores/{store}', [StoreController::class, 'destroy'])->name('stores.destroy');

        // Camera Management (Epic 4)
        Route::get('/cameras', [CameraController::class, 'index'])->name('cameras.index');
        Route::post('/cameras', [CameraController::class, 'store'])->name('cameras.store');
        Route::put('/cameras/{camera}', [CameraController::class, 'update'])->name('cameras.update');
        Route::delete('/cameras/{camera}', [CameraController::class, 'destroy'])->name('cameras.destroy');
        Route::post('/cameras/test-connection', [CameraController::class, 'testConnection'])->name('cameras.test-connection');

        // User Management (Epic 2)
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::get('/users/{user}/permissions', [UserController::class, 'permissions'])->name('users.permissions');
        Route::post('/users/{user}/permissions', [UserController::class, 'updatePermissions'])->name('users.permissions.update');

        // Roles & Permissions Catalog (Epic 2)
        Route::get('/roles-permissions', [RolePermissionController::class, 'index'])->name('roles.index');
        Route::put('/roles-permissions/{role}', [RolePermissionController::class, 'updateRolePermissions'])->name('roles.update');

        // Activity Log (Audit Trail)
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('logs.index');
    });
});
