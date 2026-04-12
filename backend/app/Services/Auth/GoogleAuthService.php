<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthService
{
    public function redirectUrl(): string
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();
    }

    public function resolveUserFromCallback(): User
    {
        $googleUser = Socialite::driver('google')
            ->stateless()
            ->user();

        $user = User::query()
            ->where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if (!$user) {
            $user = new User();
            $user->password = Str::password(32);
            $user->role = 'resident';
            $user->is_active = true;
        }

        $user->fill([
            'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Usuario Google',
            'email' => $googleUser->getEmail(),
            'google_id' => $googleUser->getId(),
            'avatar_url' => $googleUser->getAvatar(),
            'email_verified_at' => now(),
        ]);

        $user->save();

        return $user;
    }
}
