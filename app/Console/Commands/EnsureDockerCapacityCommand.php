<?php

namespace App\Console\Commands;

use App\Jobs\ProvisionDockerHostJob;
use App\Models\DockerHost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class EnsureDockerCapacityCommand extends Command
{
    protected $signature = 'docker:ensure-capacity';
    protected $description = 'Check Docker host capacity and provision new hosts if needed';

    public function handle(): int
    {
        if (!config('services.docker.enabled')) {
            $this->info('Docker deployment is disabled.');
            return self::SUCCESS;
        }

        $readyHosts = DockerHost::where('status', 'ready')->get();
        $totalAvailable = $readyHosts->sum(fn ($h) => $h->availableSlots());
        $minSlots = config('services.docker.min_available_slots', 3);

        $this->info("Docker capacity: {$totalAvailable} available slots across {$readyHosts->count()} ready host(s) (min: {$minSlots})");

        if ($totalAvailable >= $minSlots) {
            $this->info('Capacity is sufficient.');
            return self::SUCCESS;
        }

        // Check if a host is already provisioning
        $provisioning = DockerHost::where('status', 'provisioning')->exists();
        if ($provisioning) {
            $this->info('A host is already provisioning. Skipping.');
            return self::SUCCESS;
        }

        // Provision a new host
        $serverType = config('services.docker.host_server_type', 'cpx42');
        $location = config('services.docker.host_location', 'hel1');
        $maxContainers = config('services.docker.max_containers', 12);

        $hostNumber = DockerHost::count() + 1;
        $host = DockerHost::create([
            'name' => "cloudclaw-docker-host-{$hostNumber}",
            'status' => 'provisioning',
            'server_type' => $serverType,
            'location' => $location,
            'max_containers' => $maxContainers,
        ]);

        ProvisionDockerHostJob::dispatch($host->id, $serverType, $location);

        $this->warn("Capacity low ({$totalAvailable} < {$minSlots}). Provisioning new Docker host #{$host->id}.");
        Log::info('Docker capacity low, provisioning new host', [
            'docker_host_id' => $host->id,
            'total_available' => $totalAvailable,
            'min_slots' => $minSlots,
        ]);

        return self::SUCCESS;
    }
}
