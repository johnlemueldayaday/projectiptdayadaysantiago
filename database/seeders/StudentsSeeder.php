<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class StudentsSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();

        // Get courses and departments
        $courses = DB::table('courses')->get();
        $departments = DB::table('departments')->pluck('name')->toArray();

        if ($courses->isEmpty()) {
            // Fallback simple courses
            $courses = collect([
                (object)['code' => 'BSCpE', 'name' => 'Computer Engineering', 'department' => 'Engineering'],
                (object)['code' => 'BSN', 'name' => 'Nursing', 'department' => 'Nursing'],
                (object)['code' => 'BSBA', 'name' => 'Business Administration', 'department' => 'Business Ad'],
            ]);
        }

    // Store numeric year levels so the DB contains plain numbers (1,2,3,4).
    // UI can render these as "Year 1", "Year 2" when needed.
    $years = [1, 2, 3, 4];

        // Create 50 students
        for ($i = 1; $i <= 50; $i++) {
            $name = $faker->name;
            $email = 'student' . $i . '@example.com';

            $user = User::where('email', $email)->first();
            if (!$user) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('password'),
                ]);
            }

            $course = $courses->random();
            $department = $course->department ?? ($departments ? $faker->randomElement($departments) : null);

            $names = explode(' ', $name, 3);
            $first = $names[0] ?? $name;
            $last = end($names) ?: '';

            // Generate a stable unique id number for students: S{year}{user_id padded}
            $idNumber = 'S' . now()->format('Y') . str_pad($user->id, 5, '0', STR_PAD_LEFT);
            $yearLevel = $faker->randomElement($years);

            Profile::updateOrCreate([
                'user_id' => $user->id,
            ], [
                'role' => 'student',
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'course' => $course->code ?? ($course->name ?? null),
                // Save as an integer year level (1,2,3,4)
                'year' => (int) $yearLevel,
                'department' => $department,
                'id_number' => $idNumber,
            ]);
        }
    }
}
