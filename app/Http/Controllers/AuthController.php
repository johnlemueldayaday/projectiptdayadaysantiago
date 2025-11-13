<?php
// filepath: c:\iptihs\projectiptdayadaysantiago\app\Http\Controllers\AuthController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Profile;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials, $request->has('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();

            // Check if profile exists and is complete
            $profile = Profile::where('user_id', $user->id)->first();
            $needsProfile = !$profile || !$profile->first_name || !$profile->role;

            return response()->json([
                'success' => true,
                'user' => $user,
                'needsProfile' => $needsProfile,
                'role' => $profile ? $profile->role : null,
                'redirect' => '/dashboard' // Redirect to /dashboard after login
            ]);
        }

        return response()->json([
            'success' => false,
            'errors' => ['email' => ['Invalid credentials.']]
        ], 401);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:student,faculty',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            Auth::login($user);

            // Create profile with role
            Profile::create([
                'user_id' => $user->id,
                'role' => $request->role,
                'email' => $user->email,
            ]);

            return response()->json([
                'success' => true,
                'user' => $user,
                'needsProfile' => true,
                'role' => $request->role
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'errors' => ['general' => ['Registration failed. Please try again.']]
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }

    public function user(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return response()->json($user);
    }

    public function changePassword(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Use Eloquent User model
        $user = User::find(Auth::id());
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'errors' => ['current_password' => ['Current password is incorrect.']]
            ], 422);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully!'
        ]);
    }

    public function deleteAccount(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Use Eloquent User model
        $user = User::find(Auth::id());
        if (!$user) {
            return response()->json([
                'success' => false,
                'errors' => ['general' => ['User not found.']]
            ], 404);
        }

        // Verify password before deletion
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'errors' => ['password' => ['Password is incorrect.']]
            ], 422);
        }

        try {
            // Delete profile and profile picture if exists
            $profile = Profile::where('user_id', $user->id)->first();
            if ($profile) {
                if ($profile->profile_picture) {
                    $picturePath = storage_path('app/public/' . $profile->profile_picture);
                    if (file_exists($picturePath)) {
                        @unlink($picturePath);
                    }
                }
                $profile->delete();
            }

            // Logout user before deleting account
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // Delete user account
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Account deleted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'errors' => ['general' => ['Failed to delete account. Please try again.']]
            ], 500);
        }
    }
}

