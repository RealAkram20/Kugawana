<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            // Off: Laravel's default "serve" route for this disk has no
            // explicit `url`, so it defaults to the same `/storage` prefix
            // our `public` disk (and the route below) use — left on, it
            // shadows every request there with 404s from the wrong disk
            // root. Nothing in this app uses Storage::disk('local') or its
            // temporaryUrl(); Livewire/Filament's upload previews go through
            // the `public` disk (config('filesystems.default')) instead.
            'root' => storage_path('app/private'),
            'serve' => false,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            // Not /storage: some hosts (Hostinger's edge included) fast-path any
            // request ending in a recognized static extension (.jpg, .png, ...)
            // straight to a literal filesystem lookup, bypassing .htaccess/PHP
            // entirely — so a nested /storage/{path} can never reach a Laravel
            // route, only a real file at that exact path. /media is a plain
            // symlink (public_path('media') -> storage/app/public) so those
            // requests resolve as real files with no app involvement at all.
            'url' => env('APP_URL').'/media',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('media') => storage_path('app/public'),
    ],

];
