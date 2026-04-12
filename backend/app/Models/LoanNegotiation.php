<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanNegotiation extends Model
{
    protected $fillable = [
        'loan_id',
        'user_id',
        'proposed_days',
        'message',
        'status',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
