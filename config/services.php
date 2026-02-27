<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'hetzner' => [
        'token' => env('HETZNER_API_TOKEN'),
        'mock' => env('HETZNER_MOCK', true),
        'snapshot_id' => env('HETZNER_SNAPSHOT_ID'),
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'price_id' => env('STRIPE_PRICE_ID'),
        'mock' => env('STRIPE_MOCK', true),
        'credits_per_dollar' => 250, // 1 credit = $0.004 of AI API cost
        'tiers' => [
            'starter' => ['price' => 15, 'credits' => 1000, 'stripe_price_id' => env('STRIPE_PRICE_STARTER')],
            'pro'     => ['price' => 39, 'credits' => 3000, 'stripe_price_id' => env('STRIPE_PRICE_PRO')],
            'beast'   => ['price' => 89, 'credits' => 8000, 'stripe_price_id' => env('STRIPE_PRICE_BEAST')],
        ],
    ],

    'mailcow' => [
        'url' => env('MAILCOW_API_URL'),
        'api_key' => env('MAILCOW_API_KEY'),
        'domain' => env('MAILCOW_DOMAIN', 'ai.cloudclaw.com'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URL', '/auth/google/callback'),
    ],

    'apple' => [
        'bundle_id' => env('APPLE_BUNDLE_ID', 'com.cloudclaw.app'),
    ],

    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
    ],

    'revenuecat' => [
        'api_key' => env('REVENUECAT_API_KEY'),
        'webhook_auth_key' => env('REVENUECAT_WEBHOOK_AUTH_KEY'),
    ],

    'unipile' => [
        'api_key' => env('UNIPILE_API_KEY'),
        'dsn' => env('UNIPILE_DSN'),
        'telegram_account_id' => env('UNIPILE_TELEGRAM_ACCOUNT_ID'),
    ],

    'docker' => [
        'host_ip' => env('DOCKER_HOST_IP'),
        'enabled' => env('DOCKER_DEPLOY_ENABLED', false),
        'memory_limit' => env('DOCKER_MEMORY_LIMIT', '1g'),
        'cpu_limit' => env('DOCKER_CPU_LIMIT', '1'),
        'max_containers' => (int) env('DOCKER_MAX_CONTAINERS', 12),
        'min_available_slots' => (int) env('DOCKER_MIN_AVAILABLE_SLOTS', 3),
        'host_server_type' => env('DOCKER_HOST_SERVER_TYPE', 'cpx42'),
        'host_location' => env('DOCKER_HOST_LOCATION', 'hel1'),
    ],

];
