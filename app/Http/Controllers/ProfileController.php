<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Models\Profile;
class ProfileController extends Controller
{
    public function edit()
    {
        $user = Auth::user();
        $profile = Profile::firstOrCreate(
            ['user_id' => $user->id],
            ['email' => $user->email]
        );

        return view('profile', compact('profile'));
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $profile = Profile::firstOrNew(['user_id' => $user->id]);
        $profile->first_name     = $request->first_name;
        $profile->middle_name    = $request->middle_name;
        $profile->last_name      = $request->last_name;
        $profile->sex            = $request->sex;
        $profile->nationality    = $request->nationality;
        $profile->id_number      = $request->id_number;
        $profile->contact_number = $request->contact_number;
        $profile->address        = $request->address;
        $profile->religion       = $request->religion;
        $profile->civil_status   = $request->civil_status;
        $profile->email          = $request->email;
        $profile->birthday       = $request->birthday;
        $profile->course         = $request->course;
        $profile->year           = $request->year;
        $profile->department     = $request->department;

        if ($request->hasFile('profile_picture')) {
        $path = $request->file('profile_picture')->store('profiles', 'public');
        $profile->profile_picture = $path;
        }
        $profile->user_id = $user->id;
        $profile->save();
        return redirect()->back()->with('success', 'Profile updated successfully!');
    }

    // API Methods
    public function getProfile(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $user = Auth::user();

        // Check if profile exists first to preserve role
        $profile = Profile::where('user_id', $user->id)->first();

        if (!$profile) {
            // Create new profile - check if there's a role in the request or default to student
            $role = $request->input('role', 'student');
            $profile = Profile::create([
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $role
            ]);
        }

        // Auto-generate ID number if not set
        if (!$profile->id_number) {
            $profile->id_number = $this->generateIdNumber($profile->role);
            $profile->save();
        }

        // Add a full URL for the profile picture to make it easier for the frontend
        $profileArray = $profile->toArray();
        $profileArray['profile_picture_url'] = $profile->profile_picture ? asset('storage/' . $profile->profile_picture) : null;

        return response()->json($profileArray);
    }

    private function generateIdNumber($role = 'student')
    {
        $prefix = $role === 'faculty' ? 'FAC' : 'STU';
        $random = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        return $prefix . '-' . $random;
    }

    public function updateProfile(Request $request)
    {
        // Check authentication - middleware should handle this, but double-check
        if (!Auth::check()) {
            Log::warning('Profile update attempted without authentication', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
            return response()->json(['error' => 'Unauthenticated', 'message' => 'Please log in to update your profile.'], 401);
        }

        $user = Auth::user();

        // Additional safety check
        if (!$user || !$user->id) {
            return response()->json(['error' => 'Unauthenticated', 'message' => 'Invalid user session.'], 401);
        }

        $profile = Profile::firstOrNew(['user_id' => $user->id]);

        // Basic fields
        $profile->first_name     = $request->first_name;
        $profile->middle_name    = $request->middle_name;
        $profile->last_name      = $request->last_name;
        $profile->sex            = $request->sex;
        $profile->nationality    = $request->nationality;
        $profile->contact_number = $request->contact_number;
        $profile->address        = $request->address;
        $profile->religion       = $request->religion;
        $profile->civil_status   = $request->civil_status;
        $profile->email          = $request->email;
        $profile->birthday       = $request->birthday;

        // Auto-generate ID number if not set
        if (!$profile->id_number) {
            $role = $profile->role ?: ($request->role ?: 'student');
            $profile->id_number = $this->generateIdNumber($role);
        }

        // Role-specific fields - preserve existing role if not explicitly changed
        $existingRole = $profile->role;
        $requestRole = $request->input('role');

        // Determine role: use request role if provided, otherwise keep existing role, default to student
        $finalRole = $requestRole ?: $existingRole ?: 'student';
        $profile->role = $finalRole;

        if ($finalRole === 'faculty') {
            $profile->graduated_school = $request->graduated_school;
            $profile->year_graduated = $request->year_graduated;
            $profile->years_teaching = $request->years_teaching;
            $profile->mastery = $request->mastery;
            $profile->teaching_department = $request->teaching_department;
            // Clear student fields
            $profile->course = null;
            $profile->year = null;
            $profile->department = null;
        } else {
            $profile->course = $request->course;
            $profile->year = $request->year;
            $profile->department = $request->department;
            // Clear faculty fields
            $profile->graduated_school = null;
            $profile->year_graduated = null;
            $profile->years_teaching = null;
            $profile->mastery = null;
            $profile->teaching_department = null;
        }

        if ($request->hasFile('profile_picture')) {
            try {
                $request->validate([
                    'profile_picture' => 'image|mimes:jpeg,jpg,png|max:5120', // 5MB max
                ]);

                // Delete old profile picture if exists
                if ($profile->profile_picture) {
                    $oldPath = storage_path('app/public/' . $profile->profile_picture);
                    if (file_exists($oldPath)) {
                        @unlink($oldPath);
                    }
                }

                $path = $request->file('profile_picture')->store('profiles', 'public');
                $profile->profile_picture = $path;
            } catch (\Illuminate\Validation\ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'errors' => $e->errors(),
                    'message' => 'Profile picture validation failed.'
                ], 422);
            }
        }

        $profile->user_id = $user->id;
        $profile->save();

        // Add a full URL for the profile picture to make it easier for the frontend
        $profileArray = $profile->toArray();
        $profileArray['profile_picture_url'] = $profile->profile_picture ? asset('storage/' . $profile->profile_picture) : null;

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully!',
            'profile' => $profileArray
        ]);
    }
}
