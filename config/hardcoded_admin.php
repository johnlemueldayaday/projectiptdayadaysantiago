<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Hardcoded Admin Credentials
    |--------------------------------------------------------------------------
    |
    | These values provide a development-only hardcoded admin account that
    | authenticates without an underlying DB user. Change the values via
    | environment variables if necessary.
    |
    */

    'email' => env('HARDCODED_ADMIN_EMAIL', 'admin@example.com'),
    'username' => env('HARDCODED_ADMIN_USERNAME', 'admin'),
    'password' => env('HARDCODED_ADMIN_PASSWORD', '123123'),
    'name' => env('HARDCODED_ADMIN_NAME', 'Admin'),
];
