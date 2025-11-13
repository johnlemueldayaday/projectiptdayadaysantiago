<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Define application routes here.
|
*/

// SPA route - serve React app
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$')->name('spa');
