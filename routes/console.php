<?php

use App\Jobs\CheckServerStatusJob;
use App\Services\ProvisioningService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Check server status every 5 minutes
Schedule::job(new CheckServerStatusJob())->everyFiveMinutes();

// Charge hourly server costs
Schedule::call(function () {
    $provisioningService = app(ProvisioningService::class);
    $results = $provisioningService->chargeHourlyServerCosts();
    
    if (!empty($results)) {
        \Illuminate\Support\Facades\Log::info('Hourly server charges processed', $results);
    }
})->hourly()->name('charge-server-costs');

// Artisan command to manually check server status
Artisan::command('servers:check-status {server?}', function ($server = null) {
    $this->info('Checking server status...');
    
    CheckServerStatusJob::dispatch($server ? (int) $server : null);
    
    $this->info('Status check job dispatched.');
})->purpose('Check server status');

// Artisan command to manually charge server costs
Artisan::command('servers:charge-hourly', function () {
    $this->info('Processing hourly server charges...');
    
    $provisioningService = app(ProvisioningService::class);
    $results = $provisioningService->chargeHourlyServerCosts();
    
    foreach ($results as $serverId => $status) {
        $this->line("Server #{$serverId}: {$status}");
    }
    
    $this->info('Done.');
})->purpose('Charge hourly server costs');
