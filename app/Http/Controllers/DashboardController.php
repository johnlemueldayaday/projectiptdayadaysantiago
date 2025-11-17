<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function statistics()
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Exclude the hardcoded admin (if present) from statistics
        $hcEmail = config('hardcoded_admin.email');

        // Get students by department
        $studentsByDepartment = Profile::whereNotNull('department')
            ->where(function ($q) use ($hcEmail) {
                if ($hcEmail) {
                    $q->where('email', '<>', $hcEmail);
                }
            })
            ->select('department', DB::raw('count(*) as count'))
            ->groupBy('department')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->department => $item->count];
            })
            ->toArray();

        // Get students by year
        $studentsByYear = Profile::whereNotNull('year')
            ->where(function ($q) use ($hcEmail) {
                if ($hcEmail) {
                    $q->where('email', '<>', $hcEmail);
                }
            })
            ->select('year', DB::raw('count(*) as count'))
            ->groupBy('year')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->year => $item->count];
            })
            ->toArray();

        // Get total counts (exclude hardcoded admin by email)
        $totalStudents = Profile::where('role', 'student')
            ->whereNotNull('department')
            ->where(function ($q) use ($hcEmail) {
                if ($hcEmail) {
                    $q->where('email', '<>', $hcEmail);
                }
            })->count();

        $totalUsers = User::when($hcEmail, function ($q) use ($hcEmail) {
            $q->where('email', '<>', $hcEmail);
        })->count();

        $totalFaculty = Profile::where('role', 'faculty')
            ->where(function ($q) use ($hcEmail) {
                if ($hcEmail) {
                    $q->where('email', '<>', $hcEmail);
                }
            })->count();

        // Get faculty by teaching department
        $facultyByDepartment = Profile::where('role', 'faculty')
            ->whereNotNull('teaching_department')
            ->where(function ($q) use ($hcEmail) {
                if ($hcEmail) {
                    $q->where('email', '<>', $hcEmail);
                }
            })
            ->select('teaching_department', DB::raw('count(*) as count'))
            ->groupBy('teaching_department')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->teaching_department => $item->count];
            })
            ->toArray();

        return response()->json([
            'students_by_department' => $studentsByDepartment,
            'students_by_year' => $studentsByYear,
            'faculty_by_department' => $facultyByDepartment,
            'totals' => [
                'students' => $totalStudents,
                'faculty' => $totalFaculty,
                'users' => $totalUsers
            ]
        ]);
    }
}

