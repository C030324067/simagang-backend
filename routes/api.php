<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\LogbookController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/divisions', [DivisionController::class, 'index']);
Route::get('/public/verify-cert/{hash}', [CertificateController::class, 'verify']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Sanctum Authenticated)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile & logout
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Application Workflow Endpoints
    Route::prefix('applications')->group(function () {
        // Specific named paths first
        Route::middleware('role:intern')->group(function () {
            Route::post('/submit', [ApplicationController::class, 'submit']);
            Route::get('/my-application', [ApplicationController::class, 'myApplication']);
        });

        Route::middleware('role:admin_kepegawaian')->group(function () {
            Route::get('/pending-kepegawaian', [ApplicationController::class, 'pendingKepegawaian']);
            Route::put('/{application}/approve-kepegawaian', [ApplicationController::class, 'approveKepegawaian']);
        });

        Route::middleware('role:kabid')->group(function () {
            Route::get('/pending-kabid', [ApplicationController::class, 'pendingKabid']);
            Route::put('/{application}/approve-kabid', [ApplicationController::class, 'approveKabid']);
        });

        Route::middleware('role:kadis')->group(function () {
            Route::get('/pending-kadis', [ApplicationController::class, 'pendingKadis']);
            Route::put('/{application}/approve-kadis', [ApplicationController::class, 'approveKadis']);
        });

        Route::middleware('role:admin_kepegawaian,kabid,kadis,mentor')->group(function () {
            Route::get('/', [ApplicationController::class, 'index']);
        });

        Route::get('/{application}', [ApplicationController::class, 'show']);
    });

    // Attendance Endpoints
    Route::prefix('attendances')->group(function () {
        Route::get('/', [AttendanceController::class, 'index']);

        Route::middleware('role:intern')->group(function () {
            Route::get('/today', [AttendanceController::class, 'today']);
            Route::post('/check-in', [AttendanceController::class, 'checkIn']);
            Route::post('/check-out', [AttendanceController::class, 'checkOut']);
        });
    });

    // Logbook Endpoints
    Route::prefix('logbooks')->group(function () {
        Route::get('/', [LogbookController::class, 'index']);

        Route::middleware('role:intern')->group(function () {
            Route::post('/', [LogbookController::class, 'store']);
        });

        Route::middleware('role:mentor,admin_kepegawaian')->group(function () {
            Route::put('/{logbook}/verify', [LogbookController::class, 'verify']);
        });
    });

    // Task Management Endpoints
    Route::prefix('tasks')->group(function () {
        Route::get('/', [TaskController::class, 'index']);

        Route::middleware('role:mentor')->group(function () {
            Route::post('/', [TaskController::class, 'store']);
        });

        Route::middleware('role:intern')->group(function () {
            Route::put('/{task}/status', [TaskController::class, 'updateStatus']);
        });
    });

    // Evaluation Endpoints
    Route::prefix('evaluations')->group(function () {
        Route::get('/', [EvaluationController::class, 'index']);
        Route::get('/{intern}', [EvaluationController::class, 'show']);

        Route::middleware('role:mentor')->group(function () {
            Route::post('/', [EvaluationController::class, 'store']);
        });
    });

    // Certificate Endpoints
    Route::prefix('certificates')->group(function () {
        Route::middleware('role:intern')->group(function () {
            Route::get('/my-certificate', [CertificateController::class, 'myCertificate']);
        });

        Route::middleware('role:mentor,admin_kepegawaian')->group(function () {
            Route::post('/generate', [CertificateController::class, 'generate']);
        });
    });
});
