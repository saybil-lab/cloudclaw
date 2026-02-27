<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_transactions', function (Blueprint $table) {
            // Make credit_id nullable for LLM usage transactions (not tied to a credit purchase)
            $table->foreignId('credit_id')->nullable()->change();

            // Expand type from enum to string to support llm_usage, renewal, etc.
            $table->string('type', 32)->change();
        });
    }

    public function down(): void
    {
        Schema::table('credit_transactions', function (Blueprint $table) {
            $table->foreignId('credit_id')->nullable(false)->change();
            $table->enum('type', ['purchase', 'usage', 'refund', 'bonus'])->change();
        });
    }
};
