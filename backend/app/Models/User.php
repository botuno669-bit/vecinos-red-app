<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'google_id',
        'apartment',
        'phone',
        'avatar_url',
        'avg_rating_as_lender',
        'avg_rating_as_borrower',
        'total_incidents',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'avg_rating_as_lender' => 'float',
            'avg_rating_as_borrower' => 'float',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // Objetos publicados por este usuario
    public function items()
    {
        return $this->hasMany(Item::class);
    }

    // Préstamos donde este usuario pidió prestado
    public function borrowedLoans()
    {
        return $this->hasMany(Loan::class, 'borrower_id');
    }

    // Préstamos donde este usuario prestó (a través de sus items)
    public function lentLoans()
    {
        return $this->hasManyThrough(Loan::class, Item::class, 'user_id', 'item_id');
    }

    // Calificaciones que este usuario ha dado
    public function givenRatings()
    {
        return $this->hasMany(Rating::class, 'rater_id');
    }

    // Calificaciones que este usuario ha recibido
    public function receivedRatings()
    {
        return $this->hasMany(Rating::class, 'rated_id');
    }

    // Notificaciones de este usuario
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
