<?php

namespace App\Http\Controllers;

use App\Enums\ItemStatus;
use App\Enums\LoanStatus;
use App\Http\Requests\Loan\ApproveLoanRequest;
use App\Http\Requests\Loan\CancelLoanRequest;
use App\Http\Requests\Loan\ConfirmHandoverRequest;
use App\Http\Requests\Loan\ConfirmReturnRequest;
use App\Http\Requests\Loan\CounterOfferRequest;
use App\Http\Requests\Loan\RateLoanRequest;
use App\Http\Requests\Loan\StoreLoanRequest;
use App\Http\Resources\LoanResource;
use App\Http\Resources\RatingResource;
use App\Models\Item;
use App\Models\Loan;
use App\Models\Rating;
use App\Services\Loans\LoanWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function __construct(
        private readonly LoanWorkflowService $workflow,
    ) {
    }

    public function request(StoreLoanRequest $request): JsonResponse
    {
        $item = Item::query()->with('owner')->findOrFail($request->integer('item_id'));
        $user = $request->user();

        if ($item->user_id === $user->id) {
            abort(422, 'No puedes pedir prestado tu propio objeto.');
        }

        if ($item->status !== ItemStatus::AVAILABLE->value || $item->hasPendingApprovedLoan()) {
            abort(422, 'Este objeto ya no está disponible para préstamo.');
        }

        $existingLoan = Loan::query()
            ->where('item_id', $item->id)
            ->where('borrower_id', $user->id)
            ->whereIn('status', [
                LoanStatus::REQUESTED->value,
                LoanStatus::NEGOTIATING->value,
                LoanStatus::ACTIVE->value,
                LoanStatus::OVERDUE->value,
            ])
            ->exists();

        if ($existingLoan) {
            abort(422, 'Ya tienes un préstamo o solicitud abierta para este objeto.');
        }

        $loan = $this->workflow->createRequest(
            $user,
            $item,
            $request->integer('proposed_days'),
            $request->input('notes'),
        );

        $loan->load(['item.owner', 'item.category', 'borrower']);

        return response()->json([
            'message' => 'Solicitud enviada.',
            'data' => LoanResource::make($loan),
        ], 201);
    }

    public function approve(ApproveLoanRequest $request, Loan $loan): JsonResponse
    {
        $this->assertOwner($request, $loan);

        if (!in_array($loan->status, [LoanStatus::REQUESTED->value, LoanStatus::NEGOTIATING->value], true)) {
            abort(422, 'Este préstamo ya no se puede aprobar.');
        }

        if ($loan->delivery_confirmed_at || $loan->approved_at) {
            abort(422, 'Esta solicitud ya fue aprobada.');
        }

        if ($loan->item->status === ItemStatus::ON_LOAN->value) {
            abort(422, 'El objeto ya está prestado.');
        }

        $loan = $this->workflow->approve($request->user(), $loan, $request->integer('agreed_days'));
        $loan->load(['item.owner', 'item.category', 'borrower']);

        return response()->json([
            'message' => 'Solicitud aprobada. Falta confirmar la entrega.',
            'data' => LoanResource::make($loan),
        ]);
    }

    public function counterOffer(CounterOfferRequest $request, Loan $loan): JsonResponse
    {
        $this->assertParticipant($request, $loan);

        if ($loan->delivery_confirmed_at || $loan->approved_at) {
            abort(422, 'No puedes negociar un préstamo que ya fue aprobado.');
        }

        if (!in_array($loan->status, [LoanStatus::REQUESTED->value, LoanStatus::NEGOTIATING->value], true)) {
            abort(422, 'Este préstamo no permite negociación.');
        }

        $loan = $this->workflow->counterOffer(
            $request->user(),
            $loan,
            $request->integer('proposed_days'),
            $request->input('message'),
        );

        return response()->json([
            'message' => 'Contraoferta enviada.',
            'data' => LoanResource::make($loan->load(['item.owner', 'item.category', 'borrower', 'negotiations.user'])),
        ]);
    }

    public function cancel(CancelLoanRequest $request, Loan $loan): JsonResponse
    {
        $this->assertParticipant($request, $loan);

        if ($loan->delivery_confirmed_at || !in_array($loan->status, [LoanStatus::REQUESTED->value, LoanStatus::NEGOTIATING->value], true)) {
            abort(422, 'Solo se puede cancelar antes de que el objeto sea entregado.');
        }

        $this->workflow->cancel($request->user(), $loan, $request->input('reason'));

        return response()->json([
            'message' => 'Solicitud cancelada.',
        ]);
    }

    public function destroy(Request $request, Loan $loan): JsonResponse
    {
        $this->assertParticipant($request, $loan);

        if ($loan->status !== LoanStatus::CANCELLED->value) {
            abort(422, 'Solo se pueden eliminar solicitudes que hayan sido canceladas.');
        }

        $loan->delete();

        return response()->json([
            'message' => 'Historial de solicitud eliminado.',
        ]);
    }

    public function confirmHandover(ConfirmHandoverRequest $request, Loan $loan): JsonResponse
    {
        $this->assertBorrower($request, $loan);

        if (!$loan->approved_at || $loan->delivery_confirmed_at) {
            abort(422, 'La entrega no está pendiente de confirmación.');
        }

        $loan = $this->workflow->confirmHandover($request->user(), $loan, $request->string('code')->toString());

        return response()->json([
            'message' => 'Entrega confirmada.',
            'data' => LoanResource::make($loan->load(['item.owner', 'item.category', 'borrower'])),
        ]);
    }

    public function initiateReturn(Request $request, Loan $loan): JsonResponse
    {
        $this->assertBorrower($request, $loan);

        if (!in_array($loan->status, [LoanStatus::ACTIVE->value, LoanStatus::OVERDUE->value], true) || !$loan->delivery_confirmed_at) {
            abort(422, 'Este préstamo todavía no se puede devolver.');
        }

        $loan = $this->workflow->initiateReturn($request->user(), $loan);

        return response()->json([
            'message' => 'Devolución iniciada.',
            'return_code' => $loan->return_code,
            'data' => LoanResource::make($loan),
        ]);
    }

    public function confirmReturn(ConfirmReturnRequest $request, Loan $loan): JsonResponse
    {
        $this->assertOwner($request, $loan);

        if (!in_array($loan->status, [LoanStatus::ACTIVE->value, LoanStatus::OVERDUE->value], true) || !$loan->return_code) {
            abort(422, 'No hay una devolución pendiente de confirmar.');
        }

        $loan = $this->workflow->confirmReturn($request->user(), $loan, $request->string('code')->toString());

        return response()->json([
            'message' => 'Préstamo cerrado.',
            'data' => LoanResource::make($loan->load(['item.owner', 'item.category', 'borrower'])),
        ]);
    }

    public function myBorrowedLoans(Request $request): JsonResponse
    {
        $loans = Loan::query()
            ->where('borrower_id', $request->user()->id)
            ->with(['item.owner', 'item.category', 'borrower'])
            ->latest()
            ->get();

        return response()->json([
            'data' => LoanResource::collection($loans),
        ]);
    }

    public function myLentLoans(Request $request): JsonResponse
    {
        $itemIds = $request->user()->items()->pluck('id');

        $loans = Loan::query()
            ->whereIn('item_id', $itemIds)
            ->with(['item.owner', 'item.category', 'borrower'])
            ->latest()
            ->get();

        return response()->json([
            'data' => LoanResource::collection($loans),
        ]);
    }

    public function show(Request $request, Loan $loan): JsonResponse
    {
        $this->assertCanView($request, $loan);

        $loan->load([
            'item.owner',
            'item.category',
            'borrower',
            'negotiations.user',
            'ratings.rater',
            'history',
        ]);

        if ($request->user()->id !== $loan->item->user_id) {
            $loan->makeHidden('delivery_code');
        }

        if ($request->user()->id !== $loan->borrower_id) {
            $loan->makeHidden('return_code');
        }

        return response()->json([
            'data' => LoanResource::make($loan),
        ]);
    }

    public function getDeliveryCode(Request $request, Loan $loan): JsonResponse
    {
        $this->assertOwner($request, $loan);

        if (!$loan->approved_at || $loan->delivery_confirmed_at) {
            abort(422, 'No hay entrega pendiente.');
        }

        return response()->json([
            'delivery_code' => $loan->delivery_code,
        ]);
    }

    public function rate(RateLoanRequest $request, Loan $loan): JsonResponse
    {
        $this->assertParticipant($request, $loan);

        if ($loan->status !== LoanStatus::RETURNED->value) {
            abort(422, 'Solo se puede calificar un préstamo finalizado.');
        }

        $alreadyRated = Rating::query()
            ->where('loan_id', $loan->id)
            ->where('rater_id', $request->user()->id)
            ->exists();

        if ($alreadyRated) {
            abort(422, 'Ya calificaste este préstamo.');
        }

        $rating = $this->workflow->registerRating(
            $request->user(),
            $loan,
            $request->integer('score'),
            $request->input('comment'),
        );

        return response()->json([
            'message' => 'Calificación registrada.',
            'data' => RatingResource::make($rating->load('rater')),
        ], 201);
    }

    private function assertOwner(Request $request, Loan $loan): void
    {
        abort_unless($loan->item->user_id === $request->user()->id, 403, 'No autorizado.');
    }

    private function assertBorrower(Request $request, Loan $loan): void
    {
        abort_unless($loan->borrower_id === $request->user()->id, 403, 'No autorizado.');
    }

    private function assertParticipant(Request $request, Loan $loan): void
    {
        $userId = $request->user()->id;

        abort_unless(
            $loan->borrower_id === $userId || $loan->item->user_id === $userId,
            403,
            'No autorizado.'
        );
    }

    private function assertCanView(Request $request, Loan $loan): void
    {
        $user = $request->user();

        abort_unless(
            $user->isAdmin() || $loan->borrower_id === $user->id || $loan->item->user_id === $user->id,
            403,
            'No autorizado.'
        );
    }
}
