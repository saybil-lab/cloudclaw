<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('docker_hosts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hetzner_id')->nullable();
            $table->string('name');
            $table->string('ip')->nullable();
            $table->string('server_type')->default('cpx42');
            $table->string('location')->default('hel1');
            $table->string('status')->default('provisioning'); // provisioning, ready, draining, offline, error
            $table->unsignedInteger('max_containers')->default(12);
            $table->timestamp('ready_at')->nullable();
            $table->longText('provision_log')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('docker_hosts');
    }
};
