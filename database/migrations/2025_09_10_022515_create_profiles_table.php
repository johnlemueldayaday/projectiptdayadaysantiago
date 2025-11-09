<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProfilesTable extends Migration
{
    public function up()
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // safer than foreignId at first

            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->enum('sex', ['Male', 'Female'])->nullable();
            $table->string('nationality')->nullable();
            $table->string('id_number')->nullable(); // removed unique()
            $table->string('contact_number')->nullable();
            $table->text('address')->nullable();
            $table->string('religion')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('email')->nullable();
            $table->date('birthday')->nullable();
            $table->string('course')->nullable();
            $table->string('year')->nullable();
            $table->string('department')->nullable();
            $table->string('profile_picture')->nullable();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('profiles');
    }
}
