<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\RegisterApplicationController;
use Illuminate\Support\Facades\Route;

Route::post('/register-application', [RegisterApplicationController::class, 'store'])->name('register-application.store');

Route::view('/reset-password/{token}', 'app')->name('password.reset');

Route::middleware(['auth:sanctum', 'role:admin_kepegawaian,kabid'])
    ->get('/pendaftaran/{application}/cetak-surat', [ApplicationController::class, 'cetakSuratBalasan'])
    ->whereNumber('application')
    ->name('pendaftaran.cetak-surat');

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|storage).*$');
