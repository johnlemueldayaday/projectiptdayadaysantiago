<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CoursesSeeder extends Seeder
{
    public function run()
    {
        $courses = [
            // Engineering
            ['code' => 'BSCpE', 'name' => 'Computer Engineering', 'department' => 'Engineering'],
            ['code' => 'BSCvE', 'name' => 'Civil Engineering', 'department' => 'Engineering'],
            ['code' => 'BSEE', 'name' => 'Electrical Engineering', 'department' => 'Engineering'],
            ['code' => 'BSME', 'name' => 'Mechanical Engineering', 'department' => 'Engineering'],

            // Accountancy
            ['code' => 'BSA', 'name' => 'Accountancy', 'department' => 'Accountancy'],
            ['code' => 'BSMA', 'name' => 'Management Accounting', 'department' => 'Accountancy'],

            // Business Administration
            ['code' => 'BSBA', 'name' => 'Business Administration', 'department' => 'Business Ad'],
            ['code' => 'BSFM', 'name' => 'Financial Management', 'department' => 'Business Ad'],
            ['code' => 'BSEnt', 'name' => 'Entrepreneurship', 'department' => 'Business Ad'],

            // Nursing
            ['code' => 'BSN', 'name' => 'Nursing', 'department' => 'Nursing'],

            // Teachers Education
            ['code' => 'BSEd', 'name' => 'Secondary Education', 'department' => 'Teachers Education'],
            ['code' => 'BEEd', 'name' => 'Elementary Education', 'department' => 'Teachers Education'],

            // Tourism and Hospitality
            ['code' => 'BSTM', 'name' => 'Tourism Management', 'department' => 'Tourism and Hospitality Management'],
            ['code' => 'BSHM', 'name' => 'Hospitality Management', 'department' => 'Tourism and Hospitality Management'],

            // Arts and Sciences
            ['code' => 'BAComm', 'name' => 'Communication', 'department' => 'Arts and Sciences'],
            ['code' => 'BSPSY', 'name' => 'Psychology', 'department' => 'Arts and Sciences'],
            ['code' => 'BSBIO', 'name' => 'Biology', 'department' => 'Arts and Sciences'],

            // Criminal Justice Education
            ['code' => 'BSCrim', 'name' => 'Criminology', 'department' => 'Criminal Justice Education'],
            // Computer & IT related
            ['code' => 'BSIT', 'name' => 'Information Technology', 'department' => 'Information Technology'],
            ['code' => 'BSCS', 'name' => 'Computer Science', 'department' => 'Computer Science'],
            ['code' => 'BSIS', 'name' => 'Information Systems', 'department' => 'Computer Studies'],
            ['code' => 'AICS', 'name' => 'Associate in Computer Studies', 'department' => 'Computer Studies'],
        ];

        foreach ($courses as $course) {
            DB::table('courses')->updateOrInsert([
                'code' => $course['code'],
            ], [
                'name' => $course['name'],
                'department' => $course['department'],
                'archived' => false,
                'updated_at' => now(),
                'created_at' => DB::raw('COALESCE(created_at, NOW())'),
            ]);
        }
    }
}
