<?php

use App\Http\Controllers\RegisterApplicationController;
use Illuminate\Support\Facades\Route;

Route::post('/register-application', [RegisterApplicationController::class, 'store'])->name('register-application.store');

Route::view('/reset-password/{token}', 'app')->name('password.reset');

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|storage).*$');
