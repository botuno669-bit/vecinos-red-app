<?php

namespace App\Models;

use App\Enums\ItemStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Item extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'name',
        'description',
        'image_url',
        'condition',
        'status',
        'times_loaned',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function activeLoan()
    {
        return $this->hasOne(Loan::class)->whereIn('status', ['active', 'overdue']);
    }

    public function scopeMarketplace(Builder $query): Builder
    {
        return $query
            ->with(['owner', 'category'])
            ->where('status', ItemStatus::AVAILABLE->value)
            ->whereDoesntHave('loans', function (Builder $loanQuery) {
                $loanQuery
                    ->whereNotNull('approved_at')
                    ->whereNull('delivery_confirmed_at')
                    ->where('status', '!=', 'cancelled');
            });
    }

    public function isAvailable(): bool
    {
        return $this->status === ItemStatus::AVAILABLE->value;
    }

    public function hasPendingApprovedLoan(): bool
    {
        return $this->loans()
            ->whereNotNull('approved_at')
            ->whereNull('delivery_confirmed_at')
            ->where('status', '!=', 'cancelled')
            ->exists();
    }
}
