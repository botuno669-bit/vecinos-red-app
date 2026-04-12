<?php

namespace App\Enums;

enum ItemStatus: string
{
    case AVAILABLE = 'available';
    case ON_LOAN = 'on_loan';
    case UNAVAILABLE = 'unavailable';

    public function label(): string
    {
        return match ($this) {
            self::AVAILABLE => 'Disponible',
            self::ON_LOAN => 'Prestado',
            self::UNAVAILABLE => 'No disponible',
        };
    }
}
