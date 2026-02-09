<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('hetzner_id')->nullable();
            $table->string('name');
            $table->string('ip')->nullable();
            $table->enum('status', ['pending', 'provisioning', 'running', 'stopped', 'error', 'deleted'])->default('pending');
            $table->string('server_type')->default('cx22'); // Hetzner server type
            $table->string('datacenter')->default('fsn1'); // Hetzner datacenter
            $table->string('image')->default('ubuntu-24.04');
            $table->json('specs')->nullable(); // CPU, RAM, Disk details
            $table->string('vnc_url')->nullable();
            $table->boolean('openclaw_installed')->default(false);
            $table->timestamp('provisioned_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servers');
    }
};
