<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'role',
        'first_name',
        'last_name',
        'middle_name',
        'sex',
        'nationality',
        'id_number',
        'contact_number',
        'address',
        'religion',
        'civil_status',
        'email',
        'birthday',
        'course',
        'year',
        'department',
        'graduated_school',
        'year_graduated',
        'years_teaching',
        'mastery',
        'teaching_department',
        'profile_picture',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
