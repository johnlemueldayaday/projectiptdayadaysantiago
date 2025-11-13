<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\SettingsController;

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
    Route::post('/admin-login', [AuthController::class, 'adminLogin']);
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
    Route::post('/students', [StudentsController::class, 'store'])->middleware('auth');
    Route::put('/students/{id}', [StudentsController::class, 'update'])->middleware('auth');
    Route::post('/students/{id}/archive', [StudentsController::class, 'archive'])->middleware('auth');
    Route::post('/students/{id}/restore', [StudentsController::class, 'restore'])->middleware('auth');
    Route::get('/students/departments/list', [StudentsController::class, 'departments'])->middleware('auth');

    // Faculty routes
    Route::get('/faculty', [FacultyController::class, 'index'])->middleware('auth');
    Route::get('/faculty/{id}', [FacultyController::class, 'show'])->middleware('auth');
    Route::post('/faculty', [FacultyController::class, 'store'])->middleware('auth');
    Route::put('/faculty/{id}', [FacultyController::class, 'update'])->middleware('auth');
    Route::post('/faculty/{id}/archive', [FacultyController::class, 'archive'])->middleware('auth');
    Route::post('/faculty/{id}/restore', [FacultyController::class, 'restore'])->middleware('auth');

    // Dashboard routes
    Route::get('/dashboard/statistics', [DashboardController::class, 'statistics'])->middleware('auth');

    // System settings routings
    // Courses
    Route::get('/settings/courses', [SettingsController::class, 'getCourses'])->middleware('auth');
    Route::post('/settings/courses', [SettingsController::class, 'storeCourse'])->middleware('auth');
    Route::put('/settings/courses/{id}', [SettingsController::class, 'updateCourse'])->middleware('auth');
    Route::post('/settings/courses/{id}/archive', [SettingsController::class, 'archiveCourse'])->middleware('auth');
    Route::post('/settings/courses/{id}/restore', [SettingsController::class, 'restoreCourse'])->middleware('auth');

    // Departments
    Route::get('/settings/departments', [SettingsController::class, 'getDepartments'])->middleware('auth');
    Route::post('/settings/departments', [SettingsController::class, 'storeDepartment'])->middleware('auth');
    Route::put('/settings/departments/{id}', [SettingsController::class, 'updateDepartment'])->middleware('auth');
    Route::post('/settings/departments/{id}/archive', [SettingsController::class, 'archiveDepartment'])->middleware('auth');
    Route::post('/settings/departments/{id}/restore', [SettingsController::class, 'restoreDepartment'])->middleware('auth');

    // Academic Years
    Route::get('/settings/academic-years', [SettingsController::class, 'getAcademicYears'])->middleware('auth');
    Route::post('/settings/academic-years', [SettingsController::class, 'storeAcademicYear'])->middleware('auth');
    Route::put('/settings/academic-years/{id}', [SettingsController::class, 'updateAcademicYear'])->middleware('auth');
    Route::post('/settings/academic-years/{id}/archive', [SettingsController::class, 'archiveAcademicYear'])->middleware('auth');
    Route::post('/settings/academic-years/{id}/restore', [SettingsController::class, 'restoreAcademicYear'])->middleware('auth');

    // Dropdown endpoints (no auth required for convenience)
    Route::get('/settings/courses/dropdown', [SettingsController::class, 'getActiveCoursesForDropdown']);
    Route::get('/settings/departments/dropdown', [SettingsController::class, 'getActiveDepartmentsForDropdown']);
    Route::get('/settings/academic-years/dropdown', [SettingsController::class, 'getActiveAcademicYearsForDropdown']);
});

// Sanctum route (for API tokens if needed)
Route::middleware('auth:sanctum')->get('/user-token', [AuthController::class, 'user']);
