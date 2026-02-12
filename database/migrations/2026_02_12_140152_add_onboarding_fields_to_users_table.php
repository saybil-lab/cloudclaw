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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'use_case')) {
                $table->string('use_case')->nullable();
            }
            if (!Schema::hasColumn('users', 'team_size')) {
                $table->string('team_size')->nullable();
            }
            if (!Schema::hasColumn('users', 'priority')) {
                $table->string('priority')->nullable();
            }
            if (!Schema::hasColumn('users', 'onboarding_completed')) {
                $table->boolean('onboarding_completed')->default(false);
            }
            if (!Schema::hasColumn('users', 'subscription_status')) {
                $table->string('subscription_status')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['use_case', 'team_size', 'priority', 'onboarding_completed', 'subscription_status']);
        });
    }
};
