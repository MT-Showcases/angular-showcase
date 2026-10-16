import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Reject whitespace-only text; leave empty values to Validators.required. */
export function nonBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { nonBlank: true }
    : null;
}
