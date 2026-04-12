<?php

namespace App\Enums;

enum LoanStatus: string
{
    case REQUESTED = 'requested';
    case NEGOTIATING = 'negotiating';
    case ACTIVE = 'active';
    case RETURNED = 'returned';
    case OVERDUE = 'overdue';
    case CANCELLED = 'cancelled';

    public function isOpen(): bool
    {
        return in_array($this, [
            self::REQUESTED,
            self::NEGOTIATING,
            self::ACTIVE,
            self::OVERDUE,
        ], true);
    }
}
