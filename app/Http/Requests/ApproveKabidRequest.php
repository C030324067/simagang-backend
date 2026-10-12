<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApproveKabidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'kabid'
            && $this->user()?->division_id !== null;
    }

    public function rules(): array
    {
        $divisionId = $this->user()->division_id;

        return [
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'notes' => ['nullable', 'string', 'max:1000'],
            'mentor_id' => [
                Rule::requiredIf($this->input('status') === 'approved'),
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->where('role', 'mentor')
                    ->where('is_active', true)
                    ->where('division_id', $divisionId)),
            ],
        ];
    }
}
