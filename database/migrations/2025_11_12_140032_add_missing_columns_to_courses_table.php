<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('courses', function (Blueprint $table) {
            if (!Schema::hasColumn('courses', 'name')) {
                $table->string('name')->after('code');
            }
            if (!Schema::hasColumn('courses', 'department')) {
                $table->string('department')->after('name');
            }
            if (!Schema::hasColumn('courses', 'archived')) {
                $table->boolean('archived')->default(false)->after('department');
            }
        });
    }

    public function down()
    {
        Schema::table('courses', function (Blueprint $table) {
            if (Schema::hasColumn('courses', 'name')) {
                $table->dropColumn('name');
            }
            if (Schema::hasColumn('courses', 'department')) {
                $table->dropColumn('department');
            }
            if (Schema::hasColumn('courses', 'archived')) {
                $table->dropColumn('archived');
            }
        });
    }
};
