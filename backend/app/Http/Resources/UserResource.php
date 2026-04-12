<?php

namespace App\Http\Resources;

use App\Support\ImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'apartment' => $this->apartment,
            'phone' => $this->when(
                $request->user()?->id === $this->id || $request->user()?->isAdmin(),
                $this->phone
            ),
            'avatar_url' => ImageUrl::resolve($this->avatar_url),
            'avg_rating_as_lender' => (float) $this->avg_rating_as_lender,
            'avg_rating_as_borrower' => (float) $this->avg_rating_as_borrower,
            'total_incidents' => $this->total_incidents,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
