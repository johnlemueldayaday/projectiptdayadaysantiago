<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;

class HardcodedAdminSeeder extends Seeder
{
    public function run()
    {
        $email = config('hardcoded_admin.email');
        $password = config('hardcoded_admin.password');
        $name = config('hardcoded_admin.name');

        if (!$email || !$password) {
            // Nothing to do if not configured
            return;
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'name' => $name ?? 'Admin',
                'email' => $email,
                'password' => Hash::make($password),
            ]);
        }

        // Ensure profile exists and marked as admin
        try {
            Profile::firstOrCreate(
                ['user_id' => $user->id],
                ['role' => 'admin', 'email' => $user->email, 'first_name' => $name]
            );
        } catch (\Exception $e) {
            // ignore if profiles table missing or other issues
        }
    }
}
