<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove hetzner_token (servers always managed by CloudClaw)
            if (Schema::hasColumn('users', 'hetzner_token')) {
                $table->dropColumn('hetzner_token');
            }

            // Rename billing_mode to llm_billing_mode for clarity
            if (Schema::hasColumn('users', 'billing_mode') && !Schema::hasColumn('users', 'llm_billing_mode')) {
                $table->renameColumn('billing_mode', 'llm_billing_mode');
            }

            // Add LLM API keys (encrypted)
            if (!Schema::hasColumn('users', 'anthropic_api_key')) {
                $table->text('anthropic_api_key')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'openai_api_key')) {
                $table->text('openai_api_key')->nullable()->after('anthropic_api_key');
            }

            // Add LLM credits balance (separate from server credits)
            if (!Schema::hasColumn('users', 'llm_credits')) {
                $table->decimal('llm_credits', 10, 2)->default(0)->after('openai_api_key');
            }
        });

        // Remove billing_mode from servers (servers are always paid by CloudClaw pricing)
        Schema::table('servers', function (Blueprint $table) {
            if (Schema::hasColumn('servers', 'billing_mode')) {
                $table->dropColumn('billing_mode');
            }

            // Add monthly price for the server
            if (!Schema::hasColumn('servers', 'monthly_price')) {
                $table->decimal('monthly_price', 8, 2)->default(4.99)->after('server_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('hetzner_token')->nullable();
            $table->renameColumn('llm_billing_mode', 'billing_mode');
            $table->dropColumn(['anthropic_api_key', 'openai_api_key', 'llm_credits']);
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->enum('billing_mode', ['credits', 'byok'])->default('credits');
            $table->dropColumn('monthly_price');
        });
    }
};
