<?php
// filepath: database/migrations/xxxx_xx_xx_xxxxxx_add_admin_role_to_profiles_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Update the role enum to include 'admin'
        DB::statement("ALTER TABLE profiles MODIFY COLUMN role ENUM('student', 'faculty', 'admin') NOT NULL DEFAULT 'student'");
    }

    public function down()
    {
        // Revert back to original enum
        DB::statement("ALTER TABLE profiles MODIFY COLUMN role ENUM('student', 'faculty') NOT NULL DEFAULT 'student'");
    }
};
