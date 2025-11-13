<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCodeToCoursesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
     public function up()
    {
        if (Schema::hasTable('courses') && !Schema::hasColumn('courses', 'code')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->string('code', 20)->unique()->after('id');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('courses', 'code')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->dropColumn('code');
            });
        }
    }

}
