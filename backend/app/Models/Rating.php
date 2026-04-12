<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    protected $fillable = [
        'loan_id',
        'rater_id',
        'rated_id',
        'score',
        'comment',
        'type',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function rater()
    {
        return $this->belongsTo(User::class, 'rater_id');
    }

    public function rated()
    {
        return $this->belongsTo(User::class, 'rated_id');
    }
}
