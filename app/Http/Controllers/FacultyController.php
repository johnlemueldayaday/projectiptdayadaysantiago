<?php
// filepath: c:\iptihs\projectiptdayadaysantiago\app\Http\Controllers\FacultyController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class FacultyController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = DB::table('profiles')->where('role', 'faculty');

            // Filter by department
            if ($request->has('department') && $request->department) {
                $query->where('teaching_department', $request->department);
            }

            // Filter by archived status
            if ($request->has('archived') && $request->archived === 'true') {
                $query->where('archived', true);
            } else {
                $query->where('archived', false);
            }

            $faculty = $query->orderBy('last_name')->orderBy('first_name')->get();

            return response()->json($faculty, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch faculty',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $faculty = DB::table('profiles')
                ->where('id', $id)
                ->where('role', 'faculty')
                ->first();

            if (!$faculty) {
                return response()->json(['error' => 'Faculty not found'], 404);
            }

            return response()->json($faculty, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch faculty',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // Log the incoming request data
            Log::info('Faculty creation attempt', $request->all());

            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'id_number' => 'required|string|max:50|unique:profiles,id_number',
                'email' => 'required|email|max:255|unique:profiles,email',
                'teaching_department' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                Log::error('Faculty validation failed', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $facultyId = DB::table('profiles')->insertGetId([
                'user_id' => null,
                'role' => 'faculty',
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
                'teaching_department' => $request->teaching_department,
                'years_teaching' => $request->years_teaching,
                'year_graduated' => $request->year_graduated,
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $faculty = DB::table('profiles')->where('id', $facultyId)->first();

            Log::info('Faculty created successfully', ['id' => $facultyId]);

            return response()->json([
                'success' => true,
                'message' => 'Faculty created successfully',
                'faculty' => $faculty
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating faculty: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to create faculty',
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
                'teaching_department' => 'required|string|max:255'
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
                'teaching_department' => $request->teaching_department,
                'years_teaching' => $request->years_teaching,
                'year_graduated' => $request->year_graduated,
                'updated_at' => now()
            ]);

            $faculty = DB::table('profiles')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Faculty updated successfully',
                'faculty' => $faculty
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update faculty',
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
                'message' => 'Faculty archived successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to archive faculty',
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
                'message' => 'Faculty restored successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to restore faculty',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
