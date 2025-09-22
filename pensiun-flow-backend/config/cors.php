<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Explicitly list dev origins; adjust for production as needed
    'allowed_origins' => [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        'http://192.168.110.28:8080',
        'https://supensi.rivaldev.site',
        'http://supensi.rivaldev.site',
    ],

    'allowed_origins_patterns' => [
        'http://192.168.*.*:8080',
        'https://*.rivaldev.site',
        'http://*.rivaldev.site',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Important for fetch with credentials: include
    'supports_credentials' => true,
];


