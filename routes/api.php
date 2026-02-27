<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MobileController;
use Illuminate\Support\Facades\Route;

// Apple Sign In (no auth middleware — issues token)
Route::post('/auth/apple', [AuthController::class, 'apple']);

// RevenueCat webhook (no auth middleware — uses its own auth key)
Route::post('/webhooks/revenuecat', [MobileController::class, 'handleRevenueCatWebhook']);

// Authenticated mobile app routes (Sanctum token or RevenueCat user ID)
Route::middleware('revenuecat')->group(function () {
    Route::get('/user', [MobileController::class, 'user']);
    Route::post('/deploy', [MobileController::class, 'deploy']);
    Route::get('/deploy/status', [MobileController::class, 'deployStatus']);
    Route::delete('/server', [MobileController::class, 'deleteServer']);
    Route::post('/billing-mode', [MobileController::class, 'updateBillingMode']);
    Route::post('/api-key', [MobileController::class, 'updateApiKey']);
    Route::delete('/api-key', [MobileController::class, 'removeApiKey']);

    // Auth actions requiring login
    Route::post('/auth/consent', [AuthController::class, 'consent']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dev-only: simulate INITIAL_PURCHASE to grant credits
    if (app()->environment('local')) {
        Route::post('/dev/simulate-purchase', [MobileController::class, 'devSimulatePurchase']);
    }
});
