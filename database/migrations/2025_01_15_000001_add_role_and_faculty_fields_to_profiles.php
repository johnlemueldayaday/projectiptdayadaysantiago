<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleAndFacultyFieldsToProfiles extends Migration
{
    public function up()
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->enum('role', ['student', 'faculty'])->default('student')->after('user_id');
            $table->string('graduated_school')->nullable()->after('department');
            $table->string('year_graduated')->nullable()->after('graduated_school');
            $table->integer('years_teaching')->nullable()->after('year_graduated');
            $table->string('mastery')->nullable()->after('years_teaching');
            $table->string('teaching_department')->nullable()->after('mastery');
        });
    }

    public function down()
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['role', 'graduated_school', 'year_graduated', 'years_teaching', 'mastery', 'teaching_department']);
        });
    }
}

