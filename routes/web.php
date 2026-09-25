<?php

use App\Http\Controllers\RegisterApplicationController;
use Illuminate\Support\Facades\Route;

Route::post('/register-application', [RegisterApplicationController::class, 'store'])->name('register-application.store');

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|storage).*$');
