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

            // Search by query: accept multiple param names and tokenized matching.
            $search = null;
            foreach (['q', 'search', 'query', 'term', 'name'] as $param) {
                if ($request->filled($param)) {
                    $search = trim($request->input($param));
                    break;
                }
            }

            if ($search !== null && $search !== '') {
                // split into tokens (space separated) and require ALL tokens to match.
                // Use CONCAT_WS to include middle_name and check both name orders. Use LOWER for case-insensitive matching.
                $tokens = preg_split('/\s+/', $search);

                foreach ($tokens as $token) {
                    $token = trim($token);
                    if ($token === '') {
                        continue;
                    }

                    $like = '%' . mb_strtolower($token, 'UTF-8') . '%';

                    $query->where(function ($q) use ($like) {
                        // first or last name
                        $q->whereRaw('LOWER(first_name) LIKE ?', [$like])
                          ->orWhereRaw('LOWER(last_name) LIKE ?', [$like])
                          // full name first-middle-last
                          ->orWhereRaw("LOWER(CONCAT_WS(' ', first_name, middle_name, last_name)) LIKE ?", [$like])
                          // full name last first
                          ->orWhereRaw("LOWER(CONCAT_WS(' ', last_name, first_name)) LIKE ?", [$like]);
                    });
                }
            }

            // Filter by department
            if ($request->has('department') && $request->department) {
                $query->where('department', $request->department);
            }

            // Filter by course
            if ($request->has('course') && $request->course) {
                $query->where('course', $request->course);
            }

            // Filter by year level (numeric or string). Reports send year as "1","2", etc.
            if ($request->has('year') && $request->year !== '') {
                $query->where('year', $request->year);
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

            // Ensure there is a linked user account for this student (create if missing)
            $user = \App\Models\User::where('email', $request->email)->first();
            if (!$user) {
                $user = \App\Models\User::create([
                    'name' => trim(($request->first_name ?? '') . ' ' . ($request->last_name ?? '')),
                    'email' => $request->email,
                    'password' => \Illuminate\Support\Facades\Hash::make('password'),
                ]);
            }

            $studentId = DB::table('profiles')->insertGetId([
                'user_id' => $user ? $user->id : null,
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

            // Ensure linked user exists or is updated when changing email
            $profile = DB::table('profiles')->where('id', $id)->first();
            $userId = $profile ? $profile->user_id : null;

            if ($userId) {
                $user = \App\Models\User::find($userId);
                if ($user) {
                    // update user email/name if changed
                    $user->name = trim(($request->first_name ?? '') . ' ' . ($request->last_name ?? ''));
                    $user->email = $request->email;
                    $user->save();
                }
            } else {
                // If no linked user, create one and attach
                $existingUser = \App\Models\User::where('email', $request->email)->first();
                if ($existingUser) {
                    $userId = $existingUser->id;
                } else {
                    $newUser = \App\Models\User::create([
                        'name' => trim(($request->first_name ?? '') . ' ' . ($request->last_name ?? '')),
                        'email' => $request->email,
                        'password' => \Illuminate\Support\Facades\Hash::make('password'),
                    ]);
                    $userId = $newUser->id;
                }
            }

            DB::table('profiles')->where('id', $id)->update([
                'user_id' => $userId,
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
