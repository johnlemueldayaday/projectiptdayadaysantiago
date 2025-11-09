<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Profile;

class StudentsController extends Controller
{
    /**
     * Get all students, optionally filtered by department
     */
    public function index(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $query = Profile::with('user')
            ->where('role', 'student')
            ->whereNotNull('department');

        // Filter by department if provided
        if ($request->has('department') && $request->department) {
            $query->where('department', $request->department);
        }

        $students = $query->get();

        return response()->json($students);
    }

    /**
     * Get a single student by ID
     */
    public function show($id)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $student = Profile::with('user')->findOrFail($id);

        return response()->json($student);
    }

    /**
     * Get list of all departments
     */
    public function departments()
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $departments = Profile::where('role', 'student')
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->filter()
            ->values();

        return response()->json($departments);
    }
}

