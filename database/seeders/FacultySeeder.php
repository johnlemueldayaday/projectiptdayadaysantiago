<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class FacultySeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();

        // Get departments if available
        $departments = DB::table('departments')->pluck('name')->toArray();
        if (empty($departments)) {
            $departments = ['Engineering', 'Accountancy', 'Business Ad', 'Nursing', 'Teachers Education', 'Tourism and Hospitality Management', 'Arts and Sciences', 'Criminal Justice Education'];
        }

        // Ensure a few computer/IT-focused faculty exist
        $computerFaculty = [
            ['name' => 'Dr. Alan Turing', 'email' => 'aturing@school.local', 'department' => 'Computer Science'],
            ['name' => 'Prof. Ada Lovelace', 'email' => 'alovelace@school.local', 'department' => 'Computer Studies'],
            ['name' => 'Dr. Grace Hopper', 'email' => 'ghopper@school.local', 'department' => 'Information Technology'],
        ];

        foreach ($computerFaculty as $cf) {
            $user = User::where('email', $cf['email'])->first();
            if (!$user) {
                $user = User::create([
                    'name' => $cf['name'],
                    'email' => $cf['email'],
                    'password' => Hash::make('password'),
                ]);
            }

            $names = explode(' ', $cf['name'], 3);
            $first = $names[0] ?? $cf['name'];
            $last = end($names) ?: '';

            $idNumber = 'F' . now()->format('Y') . str_pad($user->id, 5, '0', STR_PAD_LEFT);

            Profile::updateOrCreate([
                'user_id' => $user->id,
            ], [
                'role' => 'faculty',
                'first_name' => $first,
                'last_name' => $last,
                'email' => $cf['email'],
                'teaching_department' => $cf['department'],
                'id_number' => $idNumber,
            ]);
        }

        // Create 8 faculty members
        for ($i = 1; $i <= 8; $i++) {
            $name = $faker->name;
            $email = 'faculty' . $i . '@example.com';

            $user = User::where('email', $email)->first();
            if (!$user) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('password'),
                ]);
            }

            $names = explode(' ', $name, 3);
            $first = $names[0] ?? $name;
            $last = end($names) ?: '';

            // Generate a stable unique id number for faculty: F{year}{user_id padded}
            $idNumber = 'F' . now()->format('Y') . str_pad($user->id, 5, '0', STR_PAD_LEFT);

            Profile::updateOrCreate([
                'user_id' => $user->id,
            ], [
                'role' => 'faculty',
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'teaching_department' => $faker->randomElement($departments),
                'id_number' => $idNumber,
            ]);
        }
    }
}
