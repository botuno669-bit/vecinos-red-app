<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $totalUsers = User::query()->where('role', 'resident')->count();
        $totalItems = Item::query()->count();
        $totalLoans = Loan::query()->count();
        $activeLoans = Loan::query()->whereIn('status', ['active', 'overdue'])->count();
        $pendingApprovals = Loan::query()->whereNull('approved_at')->whereIn('status', ['requested', 'negotiating'])->count();
        $pendingHandovers = Loan::query()->whereNotNull('approved_at')->whereNull('delivery_confirmed_at')->where('status', '!=', 'cancelled')->count();

        $topItems = Item::query()
            ->where('times_loaned', '>', 0)
            ->with(['owner', 'category'])
            ->orderByDesc('times_loaned')
            ->limit(5)
            ->get();

        $problematicUsers = User::query()
            ->where('total_incidents', '>', 0)
            ->orderByDesc('total_incidents')
            ->limit(5)
            ->get();

        $loansByStatus = Loan::query()
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        $loansByCategory = Loan::query()
            ->join('items', 'loans.item_id', '=', 'items.id')
            ->join('categories', 'items.category_id', '=', 'categories.id')
            ->select('categories.name as category', DB::raw('count(*) as count'))
            ->groupBy('categories.name')
            ->orderByDesc('count')
            ->get();

        $completedLoans = Loan::query()->where('status', 'returned')->count();

        return response()->json([
            'summary' => [
                'total_users' => $totalUsers,
                'total_items' => $totalItems,
                'total_loans' => $totalLoans,
                'active_loans' => $activeLoans,
                'pending_approvals' => $pendingApprovals,
                'pending_handovers' => $pendingHandovers,
                'completed_loans' => $completedLoans,
            ],
            'top_items' => $topItems,
            'problematic_users' => $problematicUsers,
            'loans_by_status' => $loansByStatus,
            'loans_by_category' => $loansByCategory,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $users = User::query()
            ->where('role', 'resident')
            ->withCount(['items', 'borrowedLoans'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $users,
        ]);
    }

    public function toggleUser(Request $request, User $user): JsonResponse
    {
        $this->assertAdmin($request);

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'message' => $user->is_active ? 'Usuario activado.' : 'Usuario desactivado.',
            'data' => $user->fresh(),
        ]);
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        $this->assertAdmin($request);

        if ($user->role === 'admin') {
            abort(403, 'No se puede eliminar a un administrador.');
        }

        try {
            $user->delete();
            return response()->json([
                'message' => 'Usuario eliminado permanentemente del sistema.',
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            abort(400, 'Imposible purgar: El usuario tiene objetos publicados o ha participado en préstamos registrados en su bitácora.');
        }
    }

    private function assertAdmin(Request $request): void
    {
        abort_unless($request->user()->isAdmin(), 403, 'No autorizado.');
    }
}
