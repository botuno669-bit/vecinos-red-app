<?php

namespace App\Console\Commands;

use App\Models\Loan;
use App\Models\LoanHistory;
use App\Models\Notification;
use Illuminate\Console\Command;

class CheckOverdueLoans extends Command
{
    protected $signature = 'loans:check-overdue';
    protected $description = 'Marca préstamos activos vencidos como overdue y genera alertas';

    public function handle(): int
    {
        $overdueLoans = Loan::where('status', 'active')
            ->whereNotNull('expected_return_date')
            ->where('expected_return_date', '<', now())
            ->with('item', 'borrower')
            ->get();

        $count = 0;

        foreach ($overdueLoans as $loan) {
            $loan->update(['status' => 'overdue']);

            LoanHistory::create([
                'loan_id' => $loan->id,
                'user_id' => null,
                'previous_status' => 'active',
                'new_status' => 'overdue',
                'action' => 'Préstamo marcado como retrasado automáticamente',
            ]);

            // Notificar al prestatario
            Notification::create([
                'user_id' => $loan->borrower_id,
                'loan_id' => $loan->id,
                'type' => 'loan_overdue',
                'title' => 'Préstamo retrasado',
                'message' => "Tu préstamo de {$loan->item->name} ha vencido. Por favor devuélvelo lo antes posible.",
            ]);

            // Notificar al dueño
            Notification::create([
                'user_id' => $loan->item->user_id,
                'loan_id' => $loan->id,
                'type' => 'loan_overdue',
                'title' => 'Préstamo retrasado',
                'message' => "El préstamo de tu {$loan->item->name} a {$loan->borrower->name} ha vencido.",
            ]);

            $count++;
        }

        $this->info("Se marcaron {$count} préstamos como retrasados.");

        return Command::SUCCESS;
    }
}
