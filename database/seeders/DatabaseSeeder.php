<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Seed base data first
        $this->call([
            \Database\Seeders\DepartmentsSeeder::class,
            \Database\Seeders\CoursesSeeder::class,
        ]);

        // Ensure hardcoded admin exists (so login won't create it)
        $this->call([
            \Database\Seeders\HardcodedAdminSeeder::class,
        ]);

        // Create faculty and students
        $this->call([
            \Database\Seeders\FacultySeeder::class,
            \Database\Seeders\StudentsSeeder::class,
        ]);
    }
}
