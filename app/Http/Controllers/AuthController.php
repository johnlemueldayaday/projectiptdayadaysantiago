<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string',
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
            $profile = \App\Models\Profile::where('user_id', $user->id)->first();
            $needsProfile = !$profile || !$profile->first_name || !$profile->role;
            
            return response()->json([
                'success' => true,
                'user' => $user,
                'needsProfile' => $needsProfile,
                'role' => $profile ? $profile->role : null
            ]);
        }

        return response()->json([
            'success' => false,
            'errors' => ['email' => 'Invalid credentials.']
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

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        Auth::login($user);

        // Create profile with role
        $profile = \App\Models\Profile::create([
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

        $user = Auth::user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'errors' => ['current_password' => 'Current password is incorrect.']
            ], 422);
        }

        // Update password
        $user->password = bcrypt($request->new_password);
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

        $user = Auth::user();

        // Verify password before deletion
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'errors' => ['password' => 'Password is incorrect.']
            ], 422);
        }

        // Delete profile and profile picture if exists
        $profile = Profile::where('user_id', $user->id)->first();
        if ($profile) {
            // Delete profile picture file if exists
            if ($profile->profile_picture) {
                $picturePath = storage_path('app/public/' . $profile->profile_picture);
                if (file_exists($picturePath)) {
                    @unlink($picturePath);
                }
            }
            // Delete profile
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
    }
}
