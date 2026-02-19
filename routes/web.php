<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminServerController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ServerController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\Auth\GoogleAuthController;
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

// Onboarding routes (auth required but not verified)
Route::middleware(['auth'])->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'index'])->name('onboarding');
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
    Route::get('/onboarding/success', [OnboardingController::class, 'success'])->name('onboarding.success');
});

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Assistants (anciennement Servers)
    Route::get('/assistants', [ServerController::class, 'index'])->name('assistants.index');
    Route::get('/assistants/create', [ServerController::class, 'create'])->name('assistants.create');
    Route::post('/assistants', [ServerController::class, 'store'])->name('assistants.store');
    Route::get('/assistants/{server}', [ServerController::class, 'show'])->name('assistants.show');
    Route::delete('/assistants/{server}', [ServerController::class, 'destroy'])->name('assistants.destroy');
    Route::post('/assistants/{server}/power', [ServerController::class, 'power'])->name('assistants.power');

    // Legacy routes redirects
    Route::redirect('/servers', '/assistants');
    Route::redirect('/servers/create', '/assistants/create');

    // Credits (for servers)
    Route::get('/credits', [CreditController::class, 'index'])->name('credits.index');
    Route::post('/credits/purchase', [CreditController::class, 'purchase'])->name('credits.purchase');
    Route::get('/credits/success', [CreditController::class, 'success'])->name('credits.success');
    Route::post('/credits/confirm', [CreditController::class, 'confirm'])->name('credits.confirm');

    // Settings (LLM billing mode and API keys)
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings/llm-billing-mode', [SettingsController::class, 'updateLlmBillingMode'])->name('settings.llm-billing-mode');
    Route::post('/settings/api-key', [SettingsController::class, 'updateApiKey'])->name('settings.api-key');
    Route::delete('/settings/api-key', [SettingsController::class, 'removeApiKey'])->name('settings.api-key.delete');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Subscription
    Route::post('/subscription/checkout', [SubscriptionController::class, 'checkout'])->name('subscription.checkout');
    Route::get('/subscription/success', [SubscriptionController::class, 'success'])->name('subscription.success');
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

Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

require __DIR__.'/auth.php';
