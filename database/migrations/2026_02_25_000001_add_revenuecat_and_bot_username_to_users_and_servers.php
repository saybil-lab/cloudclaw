<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('revenuecat_user_id')->nullable()->unique()->after('google_id');
            $table->string('platform')->nullable()->after('revenuecat_user_id');
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->string('bot_username')->nullable()->after('telegram_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['revenuecat_user_id', 'platform']);
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('bot_username');
        });
    }
};
