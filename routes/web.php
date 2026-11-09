<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RegisterApplicationController;
use App\Http\Controllers\SwitchRoleController;
use Illuminate\Support\Facades\Route;

Route::post('/register-application', [RegisterApplicationController::class, 'store'])->name('register-application.store');

Route::middleware(['auth', 'active.role'])->group(function () {
    Route::post('/switch-role', SwitchRoleController::class)->name('role.switch');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

Route::view('/reset-password/{token}', 'app')->name('password.reset');

Route::middleware(['auth:sanctum', 'role:admin_kepegawaian,kabid'])
    ->get('/pendaftaran/{application}/cetak-surat', [ApplicationController::class, 'cetakSuratBalasan'])
    ->whereNumber('application')
    ->name('pendaftaran.cetak-surat');

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|storage).*$');
