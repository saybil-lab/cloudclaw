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
            $table->string('use_case')->nullable();
            $table->string('team_size')->nullable();
            $table->string('priority')->nullable();
            $table->boolean('onboarding_completed')->default(false);
            $table->string('subscription_status')->nullable();
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
