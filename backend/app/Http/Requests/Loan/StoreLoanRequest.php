<?php

namespace App\Http\Requests\Loan;

use Illuminate\Foundation\Http\FormRequest;

class StoreLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'item_id' => ['required', 'exists:items,id'],
            'proposed_days' => ['required', 'integer', 'min:1', 'max:30'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'proposed_days.required' => 'El número de días es obligatorio.',
            'proposed_days.integer' => 'El número de días debe ser un valor entero.',
            'proposed_days.min' => 'El préstamo debe ser de al menos 1 día.',
            'proposed_days.max' => 'El préstamo máximo permitido es de 30 días.',
        ];
    }
}
