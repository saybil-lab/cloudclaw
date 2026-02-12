<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'billing_mode')) {
                $table->enum('billing_mode', ['credits', 'byok'])->default('credits')->after('email');
            }
            if (!Schema::hasColumn('users', 'hetzner_token')) {
                $table->text('hetzner_token')->nullable()->after('billing_mode');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['billing_mode', 'hetzner_token']);
        });
    }
};
