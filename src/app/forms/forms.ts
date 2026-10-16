// COMPONENT TYPE: Container
// SECTION: Angular Basics
//
// ROLE:
// - Demonstrate Angular Reactive Forms with validation
// - Show FormBuilder, FormGroup, and FormControl usage
// - Provide real-time validation feedback with visual indicators
//
// PATTERNS USED:
// - Reactive Forms pattern (FormBuilder, FormGroup)
// - Built-in and custom validators
// - Angular Material fields with accessible validation feedback
//
// NOTES FOR CONTRIBUTORS:
// - Use Reactive Forms (not Template-driven) for consistency
// - Add validators inline when creating the form group
// - Keep validation logic simple and educational
// - Use Material public APIs for control presentation and error states

import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PageHeader } from '../page-header/page-header';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-forms',
  imports: [ReactiveFormsModule, PageHeader, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './forms.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './forms.scss',
})
export class Forms {
  reactiveForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // Keep the validators visible here so the demo remains easy to follow.
    this.reactiveForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern('^[a-zA-Z]+$'),
        ],
      ],
      surname: ['', Validators.required],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'),
        ],
      ],
    });
  }

  onSubmit() {
    if (this.reactiveForm.valid) {
      console.log('Reactive form submitted:', this.reactiveForm.value);
      alert('Form reattivo inviato con successo!');
    } else {
      this.reactiveForm.markAllAsTouched();
      console.log('Reactive form is invalid:', this.reactiveForm.controls);
      alert('Form reattivo non valido. Controlla i campi e riprova.');
    }
  }
}
