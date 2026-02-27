<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('apple_user_id')->nullable()->unique()->after('google_id');
            $table->string('subscription_tier')->nullable()->after('subscription_status');
            $table->boolean('has_consented')->default(false)->after('onboarding_completed');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['apple_user_id', 'subscription_tier', 'has_consented']);
        });
    }
};
