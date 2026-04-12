<?php

namespace App\Http\Controllers;

use App\Http\Resources\RatingResource;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class RatingController extends Controller
{
    public function userRatings(User $user): JsonResponse
    {
        $ratingsAsLender = Rating::query()
            ->where('rated_id', $user->id)
            ->where('type', 'borrower_rates_lender')
            ->with('rater')
            ->latest()
            ->limit(20)
            ->get();

        $ratingsAsBorrower = Rating::query()
            ->where('rated_id', $user->id)
            ->where('type', 'lender_rates_borrower')
            ->with('rater')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'as_lender' => [
                'average' => (float) $user->avg_rating_as_lender,
                'ratings' => RatingResource::collection($ratingsAsLender),
            ],
            'as_borrower' => [
                'average' => (float) $user->avg_rating_as_borrower,
                'ratings' => RatingResource::collection($ratingsAsBorrower),
            ],
            'total_incidents' => $user->total_incidents,
        ]);
    }
}
