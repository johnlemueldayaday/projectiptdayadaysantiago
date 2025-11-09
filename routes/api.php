<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FacultyController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Authentication routes - using web middleware for session support
Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::get('/user', [AuthController::class, 'user'])->middleware('auth');
    Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('auth');
    Route::post('/delete-account', [AuthController::class, 'deleteAccount'])->middleware('auth');
    
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'getProfile'])->middleware('auth');
    Route::post('/profile', [ProfileController::class, 'updateProfile'])->middleware('auth');
    
    // Students routes
    Route::get('/students', [StudentsController::class, 'index'])->middleware('auth');
    Route::get('/students/{id}', [StudentsController::class, 'show'])->middleware('auth');
    Route::get('/students/departments/list', [StudentsController::class, 'departments'])->middleware('auth');
    
    // Faculty routes
    Route::get('/faculty', [FacultyController::class, 'index'])->middleware('auth');
    Route::get('/faculty/{id}', [FacultyController::class, 'show'])->middleware('auth');
    
    // Dashboard routes
    Route::get('/dashboard/statistics', [DashboardController::class, 'statistics'])->middleware('auth');
});

// Sanctum route (for API tokens if needed)
Route::middleware('auth:sanctum')->get('/user-token', [AuthController::class, 'user']);
