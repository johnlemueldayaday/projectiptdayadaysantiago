<?php
// filepath: c:\iptihs\projectiptdayadaysantiago\app\Http\Controllers\SettingsController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    // ==================== COURSES ====================

    public function getCourses(Request $request)
    {
        try {
            $query = DB::table('courses');

            // Filter by archived status
            if ($request->has('archived') && $request->archived === 'true') {
                $query->where('archived', true);
            } else {
                $query->where('archived', false);
            }

            $courses = $query->orderBy('code')->get();

            return response()->json($courses, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch courses',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function storeCourse(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'code' => 'required|string|max:20|unique:courses,code',
                'name' => 'required|string|max:255',
                'department' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors()
                ], 422);
            }

            $courseId = DB::table('courses')->insertGetId([
                'code' => $request->code,
                'name' => $request->name,
                'department' => $request->department,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $course = DB::table('courses')->where('id', $courseId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Course created successfully',
                'course' => $course
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create course',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateCourse(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'code' => 'required|string|max:20|unique:courses,code,' . $id,
                'name' => 'required|string|max:255',
                'department' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::table('courses')->where('id', $id)->update([
                'code' => $request->code,
                'name' => $request->name,
                'department' => $request->department,
                'updated_at' => now()
            ]);

            $course = DB::table('courses')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Course updated successfully',
                'course' => $course
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update course',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function archiveCourse($id)
    {
        try {
            DB::table('courses')->where('id', $id)->update([
                'archived' => true,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Course archived successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to archive course',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function restoreCourse($id)
    {
        try {
            DB::table('courses')->where('id', $id)->update([
                'archived' => false,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Course restored successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to restore course',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== DEPARTMENTS ====================

    public function getDepartments(Request $request)
    {
        try {
            $query = DB::table('departments');

            // Filter by archived status
            if ($request->has('archived') && $request->archived === 'true') {
                $query->where('archived', true);
            } else {
                $query->where('archived', false);
            }

            $departments = $query->orderBy('name')->get();

            return response()->json($departments, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch departments',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function storeDepartment(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:departments,name',
                'description' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors()
                ], 422);
            }

            $deptId = DB::table('departments')->insertGetId([
                'name' => $request->name,
                'description' => $request->description,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $department = DB::table('departments')->where('id', $deptId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Department created successfully',
                'department' => $department
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create department',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateDepartment(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:departments,name,' . $id,
                'description' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::table('departments')->where('id', $id)->update([
                'name' => $request->name,
                'description' => $request->description,
                'updated_at' => now()
            ]);

            $department = DB::table('departments')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Department updated successfully',
                'department' => $department
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update department',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function archiveDepartment($id)
    {
        try {
            DB::table('departments')->where('id', $id)->update([
                'archived' => true,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Department archived successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to archive department',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function restoreDepartment($id)
    {
        try {
            DB::table('departments')->where('id', $id)->update([
                'archived' => false,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Department restored successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to restore department',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== ACADEMIC YEARS ====================

    public function getAcademicYears(Request $request)
    {
        try {
            $query = DB::table('academic_years');

            // Filter by archived status
            if ($request->has('archived') && $request->archived === 'true') {
                $query->where('archived', true);
            } else {
                $query->where('archived', false);
            }

            $academicYears = $query->orderBy('year', 'desc')->get();

            return response()->json($academicYears, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch academic years',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function storeAcademicYear(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'required|string|max:20',
                'semester' => 'required|string|max:50',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'is_current' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors()
                ], 422);
            }

            // If setting as current, unset all other current academic years
            if ($request->is_current) {
                DB::table('academic_years')->update(['is_current' => false]);
            }

            $yearId = DB::table('academic_years')->insertGetId([
                'year' => $request->year,
                'semester' => $request->semester,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_current' => $request->is_current ?? false,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $academicYear = DB::table('academic_years')->where('id', $yearId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Academic year created successfully',
                'academic_year' => $academicYear
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create academic year',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateAcademicYear(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'required|string|max:20',
                'semester' => 'required|string|max:50',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'is_current' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors()
                ], 422);
            }

            // If setting as current, unset all other current academic years
            if ($request->is_current) {
                DB::table('academic_years')->where('id', '!=', $id)->update(['is_current' => false]);
            }

            DB::table('academic_years')->where('id', $id)->update([
                'year' => $request->year,
                'semester' => $request->semester,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_current' => $request->is_current ?? false,
                'updated_at' => now()
            ]);

            $academicYear = DB::table('academic_years')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Academic year updated successfully',
                'academic_year' => $academicYear
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update academic year',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function archiveAcademicYear($id)
    {
        try {
            DB::table('academic_years')->where('id', $id)->update([
                'archived' => true,
                'is_current' => false, // Can't be current if archived
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Academic year archived successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to archive academic year',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function restoreAcademicYear($id)
    {
        try {
            DB::table('academic_years')->where('id', $id)->update([
                'archived' => false,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Academic year restored successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to restore academic year',
                'message' => $e->getMessage()
            ], 500);
        }
    }
     public function getActiveCoursesForDropdown()
    {
        try {
            $courses = DB::table('courses')
                ->where('archived', false)
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'department']);

            return response()->json($courses, 200);
        } catch (\Exception $e) {
            return response()->json([], 200); // Return empty array on error
        }
    }

    public function getActiveDepartmentsForDropdown()
    {
        try {
            $departments = DB::table('departments')
                ->where('archived', false)
                ->orderBy('name')
                ->get(['id', 'name', 'description']);

            return response()->json($departments, 200);
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }

    public function getActiveAcademicYearsForDropdown()
    {
        try {
            $years = DB::table('academic_years')
                ->where('archived', false)
                ->orderBy('year', 'desc')
                ->get(['id', 'year', 'semester', 'is_current']);

            return response()->json($years, 200);
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }
}
