<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google Tag Manager
    |--------------------------------------------------------------------------
    |
    | Your GTM container ID (e.g., GTM-XXXXXXX)
    | Get it from: https://tagmanager.google.com/
    |
    */
    'gtm_id' => env('GTM_ID'),

    /*
    |--------------------------------------------------------------------------
    | Google Analytics 4
    |--------------------------------------------------------------------------
    |
    | Your GA4 measurement ID (e.g., G-XXXXXXXXXX)
    | Get it from: https://analytics.google.com/
    |
    | Note: If using GTM, you can configure GA4 through GTM instead.
    |
    */
    'ga4_id' => env('GA4_ID'),

    /*
    |--------------------------------------------------------------------------
    | Microsoft Clarity
    |--------------------------------------------------------------------------
    |
    | Your Clarity project ID (e.g., abcdefghij)
    | Get it from: https://clarity.microsoft.com/
    |
    */
    'clarity_id' => env('CLARITY_ID'),
];
