<?php

namespace App\Console\Commands;

use App\Jobs\AutoDeployJob;
use App\Models\User;
use Illuminate\Console\Command;

class RetryPendingDeploysCommand extends Command
{
    protected $signature = 'deploy:retry-pending';
    protected $description = 'Re-dispatch AutoDeployJob for subscribed users who have no assistant';

    public function handle(): int
    {
        $users = User::where('subscription_status', 'active')
            ->whereDoesntHave('servers', function ($q) {
                $q->whereNotIn('status', ['deleted']);
            })
            ->get();

        if ($users->isEmpty()) {
            $this->info('No pending deploys found.');
            return self::SUCCESS;
        }

        foreach ($users as $user) {
            $this->info("Dispatching AutoDeployJob for user #{$user->id} ({$user->email})");
            AutoDeployJob::dispatch($user->id);
        }

        $this->info("Dispatched {$users->count()} deploy(s).");
        return self::SUCCESS;
    }
}
