// COMPONENT TYPE: Container
// SECTION: Angular Basics — Reactive Forms
// ROLE: Teach control values, validation and interaction states through a local form.
// PATTERNS: Typed non-nullable forms, pure validators, inline submission snapshots.
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { nonBlank } from './non-blank.validator';

interface ContactPayload {
  name: string;
  surname: string;
  email: string;
  organization?: string;
}

@Component({
  selector: 'app-forms',
  imports: [ReactiveFormsModule, JsonPipe, MatButtonModule, MatFormFieldModule, MatInputModule,
    CodeBlock, LessonShell, LessonDisclosure],
  templateUrl: './forms.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './forms.scss',
})
export class Forms {
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly reactiveForm = this.fb.group({
    name: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    surname: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    organization: [{ value: '', disabled: true }],
  });
  submittedPayload: ContactPayload | null = null;

  readonly modelExample = `// Fragment inside the component class. Import FormBuilder and Validators
// from '@angular/forms', inject from '@angular/core', and the local nonBlank validator.
private readonly fb = inject(FormBuilder).nonNullable;
readonly reactiveForm = this.fb.group({
  name: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
  surname: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
  email: ['', [Validators.required, Validators.email]],
  organization: [{ value: '', disabled: true }],
});`;
  readonly templateExample = `<!-- Template fragment: import ReactiveFormsModule and the Material
     form-field, input and button modules in the standalone component. -->
<form [formGroup]="reactiveForm" (ngSubmit)="onSubmit()">
  <mat-form-field appearance="outline">
    <mat-label>Nome</mat-label>
    <input matInput formControlName="name" />
    @if (reactiveForm.controls.name.hasError('required')) {
      <mat-error>Il nome è obbligatorio</mat-error>
    }
  </mat-form-field>
  <!-- Add surname and email controls as in the visible demo. -->
  <button matButton="filled" type="submit" [disabled]="reactiveForm.invalid">
    Invia form
  </button>
</form>`;
  readonly validatorExample = `// Complete file: non-blank.validator.ts
import { AbstractControl, ValidationErrors } from '@angular/forms';

export function nonBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { nonBlank: true }
    : null;
}`;
  readonly submitExample = `// Fragment inside the component class; ContactPayload describes the snapshot.
onSubmit(): void {
  if (this.reactiveForm.invalid) return;
  const values = this.reactiveForm.getRawValue();
  this.submittedPayload = {
    name: values.name.trim(),
    surname: values.surname.trim(),
    email: values.email,
    ...(this.reactiveForm.controls.organization.enabled
      ? { organization: values.organization.trim() } : {}),
  };
}`;

  onSubmit(): void {
    // The button prevents invalid submission; retain this guard for programmatic calls.
    if (this.reactiveForm.invalid) return;
    const values = this.reactiveForm.getRawValue();
    this.submittedPayload = {
      name: values.name.trim(),
      surname: values.surname.trim(),
      email: values.email,
      ...(this.reactiveForm.controls.organization.enabled
        ? { organization: values.organization.trim() } : {}),
    };
  }

  toggleOrganization(): void {
    const control = this.reactiveForm.controls.organization;
    if (control.disabled) control.enable();
    else control.disable();
  }

  reset(formDirective: FormGroupDirective): void {
    // Reset the directive too: FormGroup.reset alone does not clear submitted.
    formDirective.resetForm({
      name: '', surname: '', email: '', organization: { value: '', disabled: true },
    });
    this.submittedPayload = null;
  }
}
