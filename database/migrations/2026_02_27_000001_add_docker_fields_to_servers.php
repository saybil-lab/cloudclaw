<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->string('deployment_type')->default('vm');
            $table->string('container_name')->nullable();
            $table->string('docker_host_ip')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn(['deployment_type', 'container_name', 'docker_host_ip']);
        });
    }
};
