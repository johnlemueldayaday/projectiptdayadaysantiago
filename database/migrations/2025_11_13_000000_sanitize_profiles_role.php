
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class SanitizeProfilesRole extends Migration
{
    public function up()
    {
        // normalize bad values
        DB::table('profiles')
            ->whereNull('role')
            ->orWhere('role', '')
            ->orWhereNotIn('role', ['student', 'faculty'])
            ->update(['role' => 'student']);

        // apply ENUM alteration
        DB::statement("ALTER TABLE `profiles` MODIFY COLUMN `role` ENUM('student','faculty') NOT NULL DEFAULT 'student'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE `profiles` MODIFY COLUMN `role` VARCHAR(32) NULL");
    }
}
