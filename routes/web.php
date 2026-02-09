<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminServerController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ServerController;
use App\Http\Controllers\WebhookController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Servers
    Route::resource('servers', ServerController::class)->except(['edit', 'update']);
    Route::post('/servers/{server}/power', [ServerController::class, 'power'])->name('servers.power');

    // Credits
    Route::get('/credits', [CreditController::class, 'index'])->name('credits.index');
    Route::post('/credits/purchase', [CreditController::class, 'purchase'])->name('credits.purchase');
    Route::get('/credits/success', [CreditController::class, 'success'])->name('credits.success');
    Route::post('/credits/confirm', [CreditController::class, 'confirm'])->name('credits.confirm');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('dashboard');
    
    // Admin servers
    Route::get('/servers', [AdminServerController::class, 'index'])->name('servers.index');
    Route::get('/servers/{server}', [AdminServerController::class, 'show'])->name('servers.show');
    Route::delete('/servers/{server}', [AdminServerController::class, 'destroy'])->name('servers.destroy');
    
    // Admin users
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [AdminUserController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/credits', [AdminUserController::class, 'addCredits'])->name('users.credits');
    Route::post('/users/{user}/toggle-admin', [AdminUserController::class, 'toggleAdmin'])->name('users.toggle-admin');
});

// Webhook routes (no CSRF)
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripe'])
    ->name('webhooks.stripe')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

require __DIR__.'/auth.php';
