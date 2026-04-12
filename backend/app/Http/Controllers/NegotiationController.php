<?php

namespace App\Http\Controllers;

use App\Http\Resources\LoanResource;
use App\Models\LoanNegotiation;
use App\Services\Loans\LoanWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NegotiationController extends Controller
{
    public function __construct(
        private readonly LoanWorkflowService $workflow,
    ) {
    }

    public function accept(Request $request, LoanNegotiation $negotiation): JsonResponse
    {
        $loan = $negotiation->loan()->with('item')->firstOrFail();
        $userId = $request->user()->id;

        abort_unless(
            $loan->borrower_id === $userId || $loan->item->user_id === $userId,
            403,
            'No autorizado.'
        );

        abort_if($negotiation->user_id === $userId, 422, 'No puedes aceptar tu propia contraoferta.');
        abort_if($loan->approved_at || $loan->delivery_confirmed_at, 422, 'La negociación ya fue cerrada.');
        abort_if($negotiation->status !== 'pending', 422, 'Esa contraoferta ya no está disponible.');

        $updatedLoan = $this->workflow->acceptCounterOffer($request->user(), $negotiation);
        $updatedLoan->load(['item.owner', 'item.category', 'borrower', 'negotiations.user']);

        return response()->json([
            'message' => 'Contraoferta aceptada.',
            'data' => LoanResource::make($updatedLoan),
        ]);
    }
}
