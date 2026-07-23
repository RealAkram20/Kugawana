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
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    /*
    | Every OAuth client ID the mobile app can present. A Google ID token is
    | only accepted when its `aud` claim matches one of these, which is what
    | stops a token minted for some other app being replayed against us.
    */
    'google' => [
        'client_ids' => array_values(array_filter([
            env('GOOGLE_WEB_CLIENT_ID'),
            env('GOOGLE_ANDROID_CLIENT_ID'),
            env('GOOGLE_IOS_CLIENT_ID'),
        ])),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Pesapal API v3. The base URL points at the sandbox by default; swap to
    | https://pay.pesapal.com/v3 for production. The callback and IPN URLs must
    | be reachable from the paying device's browser, so on a LAN they use the
    | machine IP rather than localhost.
    */
    'pesapal' => [
        'consumer_key' => env('PESAPAL_CONSUMER_KEY'),
        'consumer_secret' => env('PESAPAL_CONSUMER_SECRET'),
        'base_url' => env('PESAPAL_BASE_URL', 'https://cybqa.pesapal.com/pesapalv3'),
        'ipn_id' => env('PESAPAL_IPN_ID'),
        'callback_url' => env('PESAPAL_CALLBACK_URL', env('APP_URL') . '/api/wallet/pesapal/callback'),
        'ipn_url' => env('PESAPAL_IPN_URL', env('APP_URL') . '/api/wallet/pesapal/ipn'),
    ],

];
