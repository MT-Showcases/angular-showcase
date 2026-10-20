import type { PlaygroundSources } from '../components/angular-playground/playground.types';

export const CONTROL_EXAMPLE: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-control-demo',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ControlDemo {
  // Il valore iniziale appartiene al controllo: reset() lo ripristina.
  readonly name = new FormControl('Ada', {
    nonNullable: true,
    validators: [Validators.required],
  });

  reset(): void {
    // reset() ripristina il valore iniziale e rende il campo pristine e untouched.
    this.name.reset();
  }
}`,
  html: `<div class="stack">
  <mat-form-field
    class="field"
    appearance="outline"
    subscriptSizing="dynamic"
  >
    <mat-label>Nome del progetto</mat-label>
    <input
      id="control-name"
      matInput
      type="text"
      [formControl]="name"
      autocomplete="off"
      required
      aria-describedby="control-help"
    />
    <mat-hint id="control-help">Scrivi, poi esci dal campo: il valore resta nel controllo.</mat-hint>
    <!-- L'errore compare solo dopo che il campo è stato lasciato. -->
    @if (name.touched && name.hasError('required')) {
      <mat-error id="control-name-error">Il nome è obbligatorio: inserisci almeno un carattere.</mat-error>
    }
  </mat-form-field>

  <dl
    id="control-states"
    class="states"
    aria-label="Stato del controllo"
  >
    <div>
      <dt>value</dt>
      <dd id="control-value">{{ name.value }}</dd>
    </div>
    <div>
      <dt>valid</dt>
      <dd id="control-valid">{{ name.valid }}</dd>
    </div>
    <div>
      <dt>dirty</dt>
      <dd id="control-dirty">{{ name.dirty }}</dd>
    </div>
    <div>
      <dt>touched</dt>
      <dd id="control-touched">{{ name.touched }}</dd>
    </div>
  </dl>

  <div class="actions">
    <button
      id="control-reset"
      matButton="outlined"
      type="button"
      (click)="reset()"
    >
      Ripristina il valore iniziale
    </button>
  </div>

  <p class="note">
    Mentre scrivi il controllo è <strong>dirty</strong>; dopo il blur diventa
    <strong>touched</strong>. Il reset non svuota sempre il campo: riporta il valore
    iniziale impostato nel controllo e azzera gli stati.
  </p>
</div>`,
  css: `:host {
  display: block;
  min-width: 0;
}

.stack {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.field {
  /* Il campo resta contenuto nella colonna anche su schermi stretti. */
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

input[matInput] {
  /* Testo leggibile e nessuno zoom automatico sui dispositivi mobili. */
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-size: max(1rem, 16px);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.states {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.states div {
  min-width: 0;
}

.states dt {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-label-medium);
}

.states dd {
  margin: 0.25rem 0 0;
  font: var(--mat-sys-body-large);
  overflow-wrap: anywhere;
}

.note {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-small);
  line-height: 1.6;
}`,
};

export const CONTACT_EXAMPLE: PlaygroundSources = {
  typescript: `import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { nonBlank } from './non-blank.validator';

interface ContactPayload {
  name: string;
  surname: string;
  email: string;
  organization?: string;
}

@Component({
  selector: 'app-contact-demo',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ContactDemo {
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  // Un unico gruppo tipizzato: il builder deduce i valori stringa.
  readonly contactForm = this.formBuilder.group({
    name: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    surname: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    organization: [{ value: '', disabled: true }],
  });

  // Il payload è una copia: non condivide riferimenti con il form.
  submittedPayload: ContactPayload | null = null;

  submit(): void {
    // Il pulsante è già disabilitato se il form è invalido.
    if (this.contactForm.invalid) return;

    const values = this.contactForm.getRawValue();

    // Normalizza i nomi e include l'organizzazione solo se è attiva.
    this.submittedPayload = {
      name: values.name.trim(),
      surname: values.surname.trim(),
      email: values.email,
      ...(this.contactForm.controls.organization.enabled
        ? { organization: values.organization.trim() }
        : {}),
    };
  }

  toggleOrganization(): void {
    const organization = this.contactForm.controls.organization;

    if (organization.disabled) organization.enable();
    else organization.disable();
  }

  reset(directive: FormGroupDirective): void {
    // resetForm azzera anche submitted; FormGroup.reset da solo non lo fa.
    directive.resetForm({
      name: '',
      surname: '',
      email: '',
      organization: { value: '', disabled: true },
    });
    this.submittedPayload = null;
  }
}`,
  files: {
    'non-blank.validator.ts': `import { AbstractControl, ValidationErrors } from '@angular/forms';

// Un validatore puro: rifiuta le stringhe fatte solo di spazi.
export function nonBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;

  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { nonBlank: true }
    : null;
}`,
  },
  html: `<div class="stack">
  <form
    class="form"
    [formGroup]="contactForm"
    #directive="ngForm"
    novalidate
    (ngSubmit)="submit()"
  >
    <mat-form-field
      class="field"
      appearance="outline"
      subscriptSizing="dynamic"
    >
      <mat-label>Nome</mat-label>
      <input
        id="contact-name"
        matInput
        type="text"
        formControlName="name"
        autocomplete="given-name"
        required
        aria-describedby="contact-name-help"
      />
      <mat-hint id="contact-name-help">Accenti, apostrofi e trattini sono ammessi.</mat-hint>
      @if (contactForm.controls.name.touched && contactForm.controls.name.hasError('required')) {
        <mat-error id="contact-name-error">Il nome è obbligatorio.</mat-error>
      } @else if (contactForm.controls.name.touched && contactForm.controls.name.hasError('nonBlank')) {
        <mat-error id="contact-name-error">Il nome non può contenere solo spazi.</mat-error>
      } @else if (contactForm.controls.name.touched && contactForm.controls.name.hasError('maxlength')) {
        <mat-error id="contact-name-error">Il nome può avere al massimo 80 caratteri.</mat-error>
      }
    </mat-form-field>

    <mat-form-field
      class="field"
      appearance="outline"
      subscriptSizing="dynamic"
    >
      <mat-label>Cognome</mat-label>
      <input
        id="contact-surname"
        matInput
        type="text"
        formControlName="surname"
        autocomplete="family-name"
        required
        aria-describedby="contact-surname-help"
      />
      <mat-hint id="contact-surname-help">Anche un cognome breve come «Li» va bene.</mat-hint>
      @if (contactForm.controls.surname.touched && contactForm.controls.surname.hasError('required')) {
        <mat-error id="contact-surname-error">Il cognome è obbligatorio.</mat-error>
      } @else if (contactForm.controls.surname.touched && contactForm.controls.surname.hasError('nonBlank')) {
        <mat-error id="contact-surname-error">Il cognome non può contenere solo spazi.</mat-error>
      } @else if (contactForm.controls.surname.touched && contactForm.controls.surname.hasError('maxlength')) {
        <mat-error id="contact-surname-error">Il cognome può avere al massimo 80 caratteri.</mat-error>
      }
    </mat-form-field>

    <mat-form-field
      class="field"
      appearance="outline"
      subscriptSizing="dynamic"
    >
      <mat-label>Email</mat-label>
      <input
        id="contact-email"
        matInput
        type="email"
        formControlName="email"
        autocomplete="email"
        required
        aria-describedby="contact-email-help"
      />
      <mat-hint id="contact-email-help">Il validatore Angular accetta maiuscole ed estensioni lunghe.</mat-hint>
      @if (contactForm.controls.email.touched && contactForm.controls.email.hasError('required')) {
        <mat-error id="contact-email-error">L'email è obbligatoria.</mat-error>
      } @else if (contactForm.controls.email.touched && contactForm.controls.email.hasError('email')) {
        <mat-error id="contact-email-error">Formato email non valido.</mat-error>
      }
    </mat-form-field>

    <p
      id="contact-reason"
      class="reason"
    >
      @if (contactForm.invalid) {
        Invio disabilitato: completa nome, cognome ed email rispettando le regole indicate.
      } @else {
        Tutti i campi obbligatori sono validi: puoi inviare il form.
      }
    </p>

    <!-- Il pulsante segue la validità del gruppo, non un flag separato. -->
    <div class="actions">
      <button
        id="contact-submit"
        matButton="filled"
        type="submit"
        [disabled]="contactForm.invalid"
        aria-describedby="contact-reason"
      >
        Invia contatto
      </button>
      <button
        id="contact-reset"
        matButton="outlined"
        type="button"
        (click)="reset(directive)"
      >
        Ripristina tutto
      </button>
    </div>

    <section
      class="result"
      aria-labelledby="contact-state-title"
    >
      <h3 id="contact-state-title" class="result__title">Stato del form</h3>
      <dl class="states" aria-label="Stato del form">
        <div>
          <dt>valido</dt>
          <dd id="contact-valid">{{ contactForm.valid }}</dd>
        </div>
        <div>
          <dt>dirty</dt>
          <dd id="contact-dirty">{{ contactForm.dirty }}</dd>
        </div>
        <div>
          <dt>touched</dt>
          <dd id="contact-touched">{{ contactForm.touched }}</dd>
        </div>
        <div>
          <dt>submitted</dt>
          <dd id="contact-submitted">{{ directive.submitted }}</dd>
        </div>
      </dl>
    </section>
  </form>

  <section
    class="result"
    aria-labelledby="contact-result-title"
  >
    <h3 id="contact-result-title" class="result__title">Ultimo invio</h3>
    <p id="contact-status" role="status">
      @if (submittedPayload) {
        Invio locale completato. Il payload sotto è una copia dell'ultimo invio.
      } @else {
        Nessun invio: i dati restano nella pagina, senza richieste a un server.
      }
    </p>
    @if (submittedPayload) {
      <p class="note">Modificare il form ora non cambia questa copia.</p>
      <!-- Ogni invio sostituisce il payload con una nuova copia normalizzata. -->
      <pre
        id="contact-payload"
        class="output"
        aria-label="Payload dell'ultimo invio"
      >{{ submittedPayload | json }}</pre>
    }
  </section>

  <section
    class="result"
    aria-labelledby="organization-title"
  >
    <h3 id="organization-title" class="result__title">Organizzazione facoltativa</h3>
    <!-- Il controllo disabilitato conserva il valore ma resta fuori da value. -->
    <p class="note">
      Attiva il controllo per includere l'organizzazione nell'invio. Da disattivato,
      il valore resta in <code>getRawValue()</code> ma non in <code>value</code>.
    </p>
    <button
      id="organization-toggle"
      matButton="tonal"
      type="button"
      [attr.aria-pressed]="contactForm.controls.organization.enabled"
      (click)="toggleOrganization()"
    >
      {{ contactForm.controls.organization.disabled ? 'Attiva organizzazione' : 'Disattiva organizzazione' }}
    </button>
    <mat-form-field
      class="field"
      appearance="outline"
      subscriptSizing="dynamic"
    >
      <mat-label>Organizzazione</mat-label>
      <input
        id="contact-organization"
        matInput
        type="text"
        [formControl]="contactForm.controls.organization"
        autocomplete="organization"
        aria-describedby="contact-organization-help"
      />
      <mat-hint id="contact-organization-help">Facoltativa: non partecipa alla validazione del form.</mat-hint>
    </mat-form-field>
    <div class="values">
      <div>
        <h4 class="result__title">form.value</h4>
        <pre
          id="contact-value"
          class="output"
          aria-label="Valori dei controlli attivi"
        >{{ contactForm.value | json }}</pre>
      </div>
      <div>
        <h4 class="result__title">form.getRawValue()</h4>
        <pre
          id="contact-raw"
          class="output"
          aria-label="Tutti i valori inclusi i controlli disabilitati"
        >{{ contactForm.getRawValue() | json }}</pre>
      </div>
    </div>
  </section>
</div>`,
  css: `:host {
  display: block;
  min-width: 0;
}

.stack,
.form {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.field {
  /* Il campo resta contenuto nella colonna anche su schermi stretti. */
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

input[matInput] {
  /* Testo leggibile e nessuno zoom automatico sui dispositivi mobili. */
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-size: max(1rem, 16px);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.reason {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.5;
}

.result {
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.result__title {
  margin: 0 0 0.5rem;
  color: var(--mat-sys-primary);
  font: var(--mat-sys-title-small);
}

.states {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  gap: 0.75rem;
  margin: 0;
}

.states div {
  min-width: 0;
}

.states dt {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-label-medium);
}

.states dd {
  margin: 0.25rem 0 0;
  font: var(--mat-sys-body-large);
  overflow-wrap: anywhere;
}

.values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
  margin-block-start: 1rem;
}

.output {
  /* Il JSON può essere lungo: va a capo invece di allargare la pagina. */
  margin: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface-container-highest);
  color: var(--mat-sys-on-surface);
  font-family: monospace;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.note {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-small);
  line-height: 1.6;
}

code {
  padding: 0.1rem 0.3rem;
  border-radius: var(--mat-sys-corner-extra-small);
  background: var(--mat-sys-surface-container-highest);
  color: var(--mat-sys-on-surface);
  font-family: monospace;
}`,
};
