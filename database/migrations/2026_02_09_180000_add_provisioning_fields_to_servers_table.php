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
        Schema::table('servers', function (Blueprint $table) {
            $table->string('vnc_password')->nullable()->after('vnc_url');
            $table->string('email_address')->nullable()->after('vnc_password');
            $table->string('email_password')->nullable()->after('email_address');
            $table->enum('provision_status', ['pending', 'provisioning', 'ready', 'failed'])->default('pending')->after('email_password');
            $table->text('provision_log')->nullable()->after('provision_status');
            $table->string('root_password')->nullable()->after('provision_log');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn([
                'vnc_password',
                'email_address', 
                'email_password',
                'provision_status',
                'provision_log',
                'root_password',
            ]);
        });
    }
};
