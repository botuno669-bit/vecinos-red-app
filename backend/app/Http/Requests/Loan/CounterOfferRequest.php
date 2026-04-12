<?php

namespace App\Http\Requests\Loan;

use Illuminate\Foundation\Http\FormRequest;

class CounterOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'proposed_days' => ['required', 'integer', 'min:1', 'max:30'],
            'message' => ['nullable', 'string', 'max:500'],
        ];
    }
}
