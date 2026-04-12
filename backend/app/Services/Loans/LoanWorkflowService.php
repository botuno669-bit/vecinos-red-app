<?php

namespace App\Services\Loans;

use App\Enums\ItemStatus;
use App\Enums\LoanStatus;
use App\Models\Item;
use App\Models\Loan;
use App\Models\LoanHistory;
use App\Models\LoanNegotiation;
use App\Models\Notification;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanWorkflowService
{
    public function createRequest(User $borrower, Item $item, int $proposedDays, ?string $notes = null): Loan
    {
        return DB::transaction(function () use ($borrower, $item, $proposedDays, $notes) {
            $loan = Loan::create([
                'item_id' => $item->id,
                'borrower_id' => $borrower->id,
                'status' => LoanStatus::REQUESTED->value,
                'proposed_days' => $proposedDays,
                'notes' => $notes,
            ]);

            $this->history($loan, $borrower, null, LoanStatus::REQUESTED->value, 'Solicitud creada', [
                'proposed_days' => $proposedDays,
            ]);

            $this->notify(
                $item->user_id,
                $loan->id,
                'loan_requested',
                'Nueva solicitud',
                "{$borrower->name} quiere pedir prestado {$item->name} por {$proposedDays} días."
            );

            return $loan;
        });
    }

    public function approve(User $owner, Loan $loan, int $agreedDays): Loan
    {
        return DB::transaction(function () use ($owner, $loan, $agreedDays) {
            $item = $loan->item;

            $loan->update([
                'agreed_days' => $agreedDays,
                'approved_at' => now(),
                'delivery_code' => Loan::generateCode(),
                'return_code' => null,
                'return_requested_at' => null,
            ]);

            $item->update(['status' => ItemStatus::UNAVAILABLE->value]);

            $this->history($loan, $owner, $loan->status, $loan->status, 'Solicitud aprobada, pendiente de entrega', [
                'agreed_days' => $agreedDays,
            ]);

            $this->notify(
                $loan->borrower_id,
                $loan->id,
                'loan_approved',
                'Solicitud aprobada',
                "Tu solicitud para {$item->name} fue aprobada. Coordina la entrega y usa el código para confirmar."
            );

            $this->cancelCompetingRequests($loan);

            return $loan->refresh();
        });
    }

    public function counterOffer(User $actor, Loan $loan, int $proposedDays, ?string $message = null): Loan
    {
        return DB::transaction(function () use ($actor, $loan, $proposedDays, $message) {
            $loan->negotiations()->where('status', 'pending')->update(['status' => 'rejected']);

            LoanNegotiation::create([
                'loan_id' => $loan->id,
                'user_id' => $actor->id,
                'proposed_days' => $proposedDays,
                'message' => $message,
                'status' => 'pending',
            ]);

            $previousStatus = $loan->status;

            if ($loan->status !== LoanStatus::NEGOTIATING->value) {
                $loan->update(['status' => LoanStatus::NEGOTIATING->value]);
            }

            $receiverId = $actor->id === $loan->borrower_id
                ? $loan->item->user_id
                : $loan->borrower_id;

            $this->history($loan->fresh(), $actor, $previousStatus, $loan->fresh()->status, 'Nueva contraoferta enviada', [
                'proposed_days' => $proposedDays,
            ]);

            $this->notify(
                $receiverId,
                $loan->id,
                'loan_counter_offer',
                'Nueva contraoferta',
                "{$actor->name} propuso {$proposedDays} días para {$loan->item->name}."
            );

            return $loan->refresh();
        });
    }

    public function acceptCounterOffer(User $actor, LoanNegotiation $negotiation): Loan
    {
        $loan = $negotiation->loan;

        return DB::transaction(function () use ($actor, $negotiation, $loan) {
            $negotiation->update(['status' => 'accepted']);
            $loan->negotiations()
                ->whereKeyNot($negotiation->id)
                ->where('status', 'pending')
                ->update(['status' => 'rejected']);

            $approvedLoan = $this->approve($actor, $loan->fresh(), $negotiation->proposed_days);

            $this->history(
                $approvedLoan,
                $actor,
                LoanStatus::NEGOTIATING->value,
                LoanStatus::NEGOTIATING->value,
                'Contraoferta aceptada',
                [
                    'negotiation_id' => $negotiation->id,
                    'agreed_days' => $negotiation->proposed_days,
                ]
            );

            $this->notify(
                $negotiation->user_id,
                $loan->id,
                'loan_counter_offer_accepted',
                'Contraoferta aceptada',
                "Tu propuesta de {$negotiation->proposed_days} días para {$loan->item->name} fue aceptada."
            );

            return $approvedLoan->refresh();
        });
    }

    public function cancel(User $actor, Loan $loan, ?string $reason = null): void
    {
        DB::transaction(function () use ($actor, $loan, $reason) {
            $item = $loan->item;
            $previousStatus = $loan->status;

            $loan->update(['status' => LoanStatus::CANCELLED->value]);

            if ($item->status === ItemStatus::UNAVAILABLE->value) {
                $hasApprovedPending = Loan::query()
                    ->where('item_id', $item->id)
                    ->where('id', '!=', $loan->id)
                    ->whereNotNull('approved_at')
                    ->whereNull('delivery_confirmed_at')
                    ->where('status', '!=', LoanStatus::CANCELLED->value)
                    ->exists();

                if (!$hasApprovedPending && !$item->activeLoan()->exists()) {
                    $item->update(['status' => ItemStatus::AVAILABLE->value]);
                }
            }

            $notifyUserId = $actor->id === $loan->borrower_id ? $item->user_id : $loan->borrower_id;

            $this->history($loan->fresh(), $actor, $previousStatus, LoanStatus::CANCELLED->value, 'Solicitud cancelada', [
                'reason' => $reason,
            ]);

            $this->notify(
                $notifyUserId,
                $loan->id,
                'loan_cancelled',
                'Solicitud cancelada',
                $reason ?: "La solicitud para {$item->name} fue cancelada."
            );
        });
    }

    public function confirmHandover(User $borrower, Loan $loan, string $code): Loan
    {
        return DB::transaction(function () use ($borrower, $loan, $code) {
            $item = $loan->item;
            $previousStatus = $loan->status;

            if ($loan->delivery_code !== $code) {
                $this->invalid('El código de entrega no es válido.');
            }

            $loan->update([
                'status' => LoanStatus::ACTIVE->value,
                'start_date' => now()->toDateString(),
                'expected_return_date' => now()->addDays($loan->agreed_days)->toDateString(),
                'delivery_confirmed_at' => now(),
            ]);

            $item->update(['status' => ItemStatus::ON_LOAN->value]);

            $this->history($loan->fresh(), $borrower, $previousStatus, LoanStatus::ACTIVE->value, 'Entrega confirmada por el prestatario', [
                'agreed_days' => $loan->agreed_days,
            ]);

            $this->notify(
                $item->user_id,
                $loan->id,
                'loan_handover_confirmed',
                'Entrega confirmada',
                "{$borrower->name} confirmó que recibió {$item->name}."
            );

            return $loan->refresh();
        });
    }

    public function initiateReturn(User $borrower, Loan $loan): Loan
    {
        return DB::transaction(function () use ($borrower, $loan) {
            $loan->update([
                'return_code' => Loan::generateCode(),
                'return_requested_at' => now(),
            ]);

            $this->history($loan->fresh(), $borrower, $loan->status, $loan->status, 'Devolución iniciada', [
                'return_requested_at' => now()->toIso8601String(),
            ]);

            $this->notify(
                $loan->item->user_id,
                $loan->id,
                'loan_return_started',
                'Devolución iniciada',
                "{$borrower->name} inició la devolución de {$loan->item->name}. Usa el código para cerrar el préstamo."
            );

            return $loan->refresh();
        });
    }

    public function confirmReturn(User $owner, Loan $loan, string $code): Loan
    {
        return DB::transaction(function () use ($owner, $loan, $code) {
            $item = $loan->item;
            $previousStatus = $loan->status;

            if ($loan->return_code !== $code) {
                $this->invalid('El código de devolución no es válido.');
            }

            $loan->update([
                'status' => LoanStatus::RETURNED->value,
                'actual_return_date' => now()->toDateString(),
                'return_confirmed_at' => now(),
            ]);

            $item->update([
                'status' => ItemStatus::AVAILABLE->value,
                'times_loaned' => $item->times_loaned + 1,
            ]);

            if ($previousStatus === LoanStatus::OVERDUE->value) {
                $loan->borrower->increment('total_incidents');
            }

            $this->history($loan->fresh(), $owner, $previousStatus, LoanStatus::RETURNED->value, 'Préstamo cerrado y devuelto', [
                'was_overdue' => $previousStatus === LoanStatus::OVERDUE->value,
            ]);

            $this->notify(
                $loan->borrower_id,
                $loan->id,
                'loan_completed',
                'Préstamo finalizado',
                "La devolución de {$item->name} fue confirmada. Ya puedes calificar la experiencia."
            );

            $this->notify(
                $item->user_id,
                $loan->id,
                'loan_completed',
                'Préstamo finalizado',
                "El préstamo de {$item->name} se cerró correctamente. Ya puedes calificar al prestatario."
            );

            return $loan->refresh();
        });
    }

    public function registerRating(User $actor, Loan $loan, int $score, ?string $comment = null): Rating
    {
        return DB::transaction(function () use ($actor, $loan, $score, $comment) {
            $item = $loan->item;
            $isOwner = $item->user_id === $actor->id;
            $ratedId = $isOwner ? $loan->borrower_id : $item->user_id;
            $type = $isOwner ? 'lender_rates_borrower' : 'borrower_rates_lender';

            $rating = Rating::create([
                'loan_id' => $loan->id,
                'rater_id' => $actor->id,
                'rated_id' => $ratedId,
                'score' => $score,
                'comment' => $comment,
                'type' => $type,
            ]);

            $this->recalculateUserRating(User::findOrFail($ratedId), $type);

            return $rating;
        });
    }

    private function recalculateUserRating(User $user, string $type): void
    {
        $avg = Rating::query()
            ->where('rated_id', $user->id)
            ->where('type', $type)
            ->avg('score');

        if ($type === 'lender_rates_borrower') {
            $user->update(['avg_rating_as_borrower' => round((float) $avg, 2)]);

            return;
        }

        $user->update(['avg_rating_as_lender' => round((float) $avg, 2)]);
    }

    private function cancelCompetingRequests(Loan $loan): void
    {
        $otherLoans = Loan::query()
            ->where('item_id', $loan->item_id)
            ->whereKeyNot($loan->id)
            ->whereIn('status', [LoanStatus::REQUESTED->value, LoanStatus::NEGOTIATING->value])
            ->whereNull('delivery_confirmed_at')
            ->get();

        foreach ($otherLoans as $otherLoan) {
            $previousStatus = $otherLoan->status;
            $otherLoan->update(['status' => LoanStatus::CANCELLED->value]);

            $this->history($otherLoan->fresh(), null, $previousStatus, LoanStatus::CANCELLED->value, 'Solicitud cerrada porque el objeto fue reservado por otro préstamo');

            $this->notify(
                $otherLoan->borrower_id,
                $otherLoan->id,
                'loan_unavailable',
                'Objeto no disponible',
                "La solicitud para {$loan->item->name} se cerró porque el objeto quedó reservado en otro préstamo."
            );
        }
    }

    private function history(Loan $loan, ?User $user, ?string $previousStatus, string $newStatus, string $action, array $metadata = []): void
    {
        LoanHistory::create([
            'loan_id' => $loan->id,
            'user_id' => $user?->id,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'action' => $action,
            'metadata' => $metadata ?: null,
        ]);
    }

    private function notify(int $userId, ?int $loanId, string $type, string $title, string $message): void
    {
        Notification::create([
            'user_id' => $userId,
            'loan_id' => $loanId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
        ]);
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages([
            'message' => [$message],
        ]);
    }
}
