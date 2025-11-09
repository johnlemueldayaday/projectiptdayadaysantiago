<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Profile;

class FacultyController extends Controller
{
    /**
     * Get all faculty, optionally filtered by teaching department
     */
    public function index(Request $request)
    {
        // Middleware already handles authentication, but double-check for safety
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $query = Profile::with('user')
            ->where('role', 'faculty');

        // Filter by teaching department if provided
        if ($request->has('department') && $request->department && $request->department !== '') {
            $query->where('teaching_department', $request->department);
        }

        $faculty = $query->get();

        return response()->json($faculty);
    }

    /**
     * Get a single faculty member by ID
     */
    public function show($id)
    {
        // Middleware already handles authentication, but double-check for safety
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $faculty = Profile::with('user')
            ->where('role', 'faculty')
            ->find($id);

        if (!$faculty) {
            return response()->json(['error' => 'Faculty member not found'], 404);
        }

        return response()->json($faculty);
    }
}

