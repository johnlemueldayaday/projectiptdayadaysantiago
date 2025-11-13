<?php
// filepath: c:\iptihs\projectiptdayadaysantiago\app\Http\Controllers\StudentsController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class StudentsController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = DB::table('profiles')->where('role', 'student');

            // Filter by department
            if ($request->has('department') && $request->department) {
                $query->where('department', $request->department);
            }

            // Filter by course
            if ($request->has('course') && $request->course) {
                $query->where('course', $request->course);
            }

            // Filter by archived status
            if ($request->has('archived') && $request->archived === 'true') {
                $query->where('archived', true);
            } else {
                $query->where('archived', false);
            }

            $students = $query->orderBy('last_name')->orderBy('first_name')->get();

            return response()->json($students, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch students',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $student = DB::table('profiles')
                ->where('id', $id)
                ->where('role', 'student')
                ->first();

            if (!$student) {
                return response()->json(['error' => 'Student not found'], 404);
            }

            return response()->json($student, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch student',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'id_number' => 'required|string|max:50|unique:profiles,id_number',
                'email' => 'required|email|max:255|unique:profiles,email',
                'course' => 'required|string|max:100',
                'year' => 'required|string|max:10',
                'department' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $studentId = DB::table('profiles')->insertGetId([
                'user_id' => null,
                'role' => 'student',
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'id_number' => $request->id_number,
                'email' => $request->email,
                'contact_number' => $request->contact_number,
                'sex' => $request->sex,
                'birthday' => $request->birthday,
                'nationality' => $request->nationality,
                'address' => $request->address,
                'religion' => $request->religion,
                'civil_status' => $request->civil_status,
                'course' => $request->course,
                'year' => $request->year,
                'department' => $request->department,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $student = DB::table('profiles')->where('id', $studentId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Student created successfully',
                'student' => $student
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating student: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to create student',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'id_number' => 'required|string|max:50|unique:profiles,id_number,' . $id,
                'email' => 'required|email|max:255',
                'course' => 'required|string|max:100',
                'year' => 'required|string|max:10',
                'department' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::table('profiles')->where('id', $id)->update([
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'id_number' => $request->id_number,
                'email' => $request->email,
                'contact_number' => $request->contact_number,
                'sex' => $request->sex,
                'birthday' => $request->birthday,
                'nationality' => $request->nationality,
                'address' => $request->address,
                'religion' => $request->religion,
                'civil_status' => $request->civil_status,
                'course' => $request->course,
                'year' => $request->year,
                'department' => $request->department,
                'updated_at' => now()
            ]);

            $student = DB::table('profiles')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully',
                'student' => $student
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update student',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function archive($id)
    {
        try {
            DB::table('profiles')->where('id', $id)->update([
                'archived' => true,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student archived successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to archive student',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function restore($id)
    {
        try {
            DB::table('profiles')->where('id', $id)->update([
                'archived' => false,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student restored successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to restore student',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function departments()
    {
        try {
            $departments = DB::table('profiles')
                ->where('role', 'student')
                ->distinct()
                ->pluck('department');

            return response()->json($departments, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch departments',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
