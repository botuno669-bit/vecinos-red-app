<?php

namespace App\Services\Auth;

use App\Models\User;
use Laravel\Sanctum\NewAccessToken;

class TokenService
{
    public function issue(User $user, bool $remember = false): NewAccessToken
    {
        $user->tokens()->delete();

        $expiresAt = now()->addDays($remember ? 30 : 1);

        return $user->createToken('auth-token', ['*'], $expiresAt);
    }
}
