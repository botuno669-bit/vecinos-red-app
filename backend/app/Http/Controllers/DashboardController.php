<?php

namespace App\Http\Controllers;

use App\Http\Resources\ItemResource;
use App\Models\Item;
use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeLoans = Loan::query()
            ->where(function ($query) use ($user) {
                $query
                    ->where('borrower_id', $user->id)
                    ->orWhereHas('item', fn ($itemQuery) => $itemQuery->where('user_id', $user->id));
            })
            ->whereIn('status', ['requested', 'negotiating', 'active', 'overdue'])
            ->count();

        $recentMarketplace = Item::query()
            ->marketplace()
            ->latest()
            ->limit(6)
            ->get();

        return response()->json([
            'summary' => [
                'items_count' => $user->items()->count(),
                'active_loans_count' => $activeLoans,
                'unread_notifications_count' => $user->notifications()->where('is_read', false)->count(),
            ],
            'marketplace_preview' => ItemResource::collection($recentMarketplace),
        ]);
    }
}
