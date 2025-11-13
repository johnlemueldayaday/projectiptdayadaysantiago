<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentsSeeder extends Seeder
{
    public function run()
    {
        $departments = [
            ['name' => 'Engineering', 'description' => 'Engineering programs including Civil, Electrical, and Mechanical'],
            ['name' => 'Accountancy', 'description' => 'Accountancy and Financial Management programs'],
            ['name' => 'Business Ad', 'description' => 'Business Administration and Management programs'],
            ['name' => 'Nursing', 'description' => 'Nursing and Healthcare programs'],
            ['name' => 'Teachers Education', 'description' => 'Education programs for Elementary and Secondary'],
            ['name' => 'Tourism and Hospitality Management', 'description' => 'Tourism and Hospitality programs'],
            ['name' => 'Arts and Sciences', 'description' => 'Liberal Arts and Sciences programs'],
            ['name' => 'Criminal Justice Education', 'description' => 'Criminology and Criminal Justice programs'],
        ];

        foreach ($departments as $dept) {
            DB::table('departments')->insert([
                'name' => $dept['name'],
                'description' => $dept['description'],
                'archived' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
