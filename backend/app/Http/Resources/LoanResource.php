<?php

namespace App\Http\Resources;

use App\Enums\LoanStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'workflow_state' => $this->workflowState(),
            'workflow_label' => $this->workflowLabel(),
            'proposed_days' => $this->proposed_days,
            'agreed_days' => $this->agreed_days,
            'notes' => $this->notes,
            'approved_at' => $this->approved_at,
            'start_date' => $this->start_date,
            'expected_return_date' => $this->expected_return_date,
            'actual_return_date' => $this->actual_return_date,
            'delivery_confirmed_at' => $this->delivery_confirmed_at,
            'return_requested_at' => $this->return_requested_at,
            'return_confirmed_at' => $this->return_confirmed_at,
            'has_pending_return' => (bool) $this->return_code && !$this->return_confirmed_at,
            'item' => $this->whenLoaded('item', fn () => ItemResource::make($this->item)),
            'borrower' => $this->whenLoaded('borrower', fn () => UserResource::make($this->borrower)),
            'negotiations' => $this->whenLoaded('negotiations', fn () => $this->negotiations->map(fn ($negotiation) => [
                'id' => $negotiation->id,
                'proposed_days' => $negotiation->proposed_days,
                'message' => $negotiation->message,
                'status' => $negotiation->status,
                'user' => UserResource::make($negotiation->user),
                'created_at' => $negotiation->created_at,
            ])),
            'history' => $this->whenLoaded('history', fn () => $this->history->map(fn ($entry) => [
                'id' => $entry->id,
                'action' => $entry->action,
                'previous_status' => $entry->previous_status,
                'new_status' => $entry->new_status,
                'metadata' => $entry->metadata,
                'created_at' => $entry->created_at,
            ])),
            'ratings' => $this->whenLoaded('ratings', fn () => RatingResource::collection($this->ratings)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function workflowState(): string
    {
        $status = LoanStatus::from($this->status);

        if ($status === LoanStatus::CANCELLED) {
            return 'cancelled';
        }

        if ($status === LoanStatus::RETURNED) {
            return 'completed';
        }

        if ($status === LoanStatus::OVERDUE && $this->return_code && !$this->return_confirmed_at) {
            return 'overdue_return_pending';
        }

        if ($status === LoanStatus::OVERDUE) {
            return 'overdue';
        }

        if ($status === LoanStatus::ACTIVE && $this->return_code && !$this->return_confirmed_at) {
            return 'return_pending';
        }

        if ($status === LoanStatus::ACTIVE) {
            return 'active';
        }

        if ($this->approved_at && !$this->delivery_confirmed_at) {
            return 'pending_handover';
        }

        if ($status === LoanStatus::NEGOTIATING) {
            return 'negotiating';
        }

        return 'pending_owner';
    }

    private function workflowLabel(): string
    {
        return match ($this->workflowState()) {
            'pending_handover' => 'Aprobado, pendiente de entrega',
            'negotiating' => 'En negociación',
            'active' => 'Prestado',
            'return_pending' => 'Devolución solicitada',
            'overdue' => 'Retrasado',
            'overdue_return_pending' => 'Retrasado, devolución solicitada',
            'completed' => 'Finalizado',
            'cancelled' => 'Cancelado',
            default => 'Pendiente de aprobación',
        };
    }
}
