<?php

namespace App\Models;

use App\Enums\LoanStatus;
use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    protected $fillable = [
        'item_id',
        'borrower_id',
        'status',
        'proposed_days',
        'agreed_days',
        'approved_at',
        'start_date',
        'expected_return_date',
        'actual_return_date',
        'delivery_code',
        'return_code',
        'delivery_confirmed_at',
        'return_requested_at',
        'return_confirmed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'start_date' => 'date',
            'expected_return_date' => 'date',
            'actual_return_date' => 'date',
            'delivery_confirmed_at' => 'datetime',
            'return_requested_at' => 'datetime',
            'return_confirmed_at' => 'datetime',
        ];
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function borrower()
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    // El dueño del objeto (lender) se accede a través del item
    public function lender()
    {
        return $this->hasOneThrough(User::class, Item::class, 'id', 'id', 'item_id', 'user_id');
    }

    public function negotiations()
    {
        return $this->hasMany(LoanNegotiation::class);
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function history()
    {
        return $this->hasMany(LoanHistory::class)->orderBy('created_at', 'desc');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function isOverdue(): bool
    {
        return $this->status === LoanStatus::ACTIVE->value
            && $this->expected_return_date
            && $this->expected_return_date->isPast();
    }

    public function isPendingHandover(): bool
    {
        return !is_null($this->approved_at) && is_null($this->delivery_confirmed_at) && $this->status !== LoanStatus::CANCELLED->value;
    }

    public static function generateCode(): string
    {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}
