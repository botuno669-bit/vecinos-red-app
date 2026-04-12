<?php

namespace App\Http\Resources;

use App\Enums\ItemStatus;
use App\Support\ImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reservedLoan = $this->relationLoaded('loans')
            ? $this->loans->first(fn ($loan) => $loan->approved_at && !$loan->delivery_confirmed_at && $loan->status !== 'cancelled')
            : null;

        $marketplaceStatus = $reservedLoan ? 'reserved' : $this->status;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'condition' => $this->condition,
            'status' => $this->status,
            'marketplace_status' => $marketplaceStatus,
            'marketplace_status_label' => match ($marketplaceStatus) {
                'reserved' => 'Reservado',
                ItemStatus::AVAILABLE->value => ItemStatus::AVAILABLE->label(),
                ItemStatus::ON_LOAN->value => ItemStatus::ON_LOAN->label(),
                default => ItemStatus::UNAVAILABLE->label(),
            },
            'times_loaned' => $this->times_loaned,
            'image_url' => ImageUrl::resolve($this->image_url),
            'category' => $this->whenLoaded('category', fn () => CategoryResource::make($this->category)),
            'owner' => $this->whenLoaded('owner', fn () => UserResource::make($this->owner)),
            'active_loan' => $this->whenLoaded('activeLoan', fn () => LoanResource::make($this->activeLoan)),
            'created_at' => $this->created_at,
        ];
    }
}
