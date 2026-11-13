<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaskStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $role = $this->user()?->activeRole();

        return in_array($role, ['intern', 'mentor'], true);
    }

    protected function prepareForValidation(): void
    {
        $status = $this->input('status');
        $role = $this->user()?->activeRole();
        if (! is_string($status) && ! ($role === 'intern' && blank($status))) {
            return;
        }

        if (blank($status) && $role === 'intern') {
            $this->merge(['status' => 'completed']);

            return;
        }

        $normalized = strtolower(trim($status));
        $normalized = str_replace([' ', '-'], '_', $normalized);
        if (in_array($normalized, ['perlu_revisi', 'revision', 'revision_needed'], true)) {
            $this->merge(['status' => 'revision_needed']);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $role = $this->user()?->activeRole();
        $statuses = $role === 'mentor'
            ? ['pending', 'in_progress', 'revision_needed', 'completed']
            : ['pending', 'in_progress', 'completed'];

        return [
            'status' => ['required', Rule::in($statuses)],
            'submission_notes' => ['nullable', 'string', 'max:1000'],
            'submission_file' => ['nullable', 'file', 'max:30720'],
            'catatan_revisi' => [Rule::requiredIf(fn (): bool => $this->user()?->activeRole() === 'mentor' && $this->input('status') === 'revision_needed'), 'nullable', 'string', 'max:1000'],
            'revision_file' => ['nullable', 'file', 'max:30720'],
        ];
    }
}
