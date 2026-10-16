import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeader } from '../page-header/page-header';
import { CodeBlock } from '../components/code-block/code-block';
import { ConceptCard } from '../components/concept-card/concept-card';
import { FeatureCard } from '../components/feature-card/feature-card';
import { GuideStep } from '../components/guide-step/guide-step';
import { Icon } from '../components/icon/icon';

@Component({
  selector: 'app-design-system',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    PageHeader,
    CodeBlock,
    ConceptCard,
    FeatureCard,
    GuideStep,
    Icon,
  ],
  templateUrl: './design-system.html',
  styleUrl: './design-system.scss',
})
export class DesignSystem {
  readonly palette = [
    { label: 'Azione primaria', background: 'primary', foreground: 'on-primary' },
    { label: 'Contenitore primario', background: 'primary-container', foreground: 'on-primary-container' },
    { label: 'Superficie', background: 'surface', foreground: 'on-surface' },
    { label: 'Superficie secondaria', background: 'surface-container', foreground: 'on-surface' },
    { label: 'Errore', background: 'error', foreground: 'on-error' },
    { label: 'Contenitore errore', background: 'error-container', foreground: 'on-error-container' },
  ];
  readonly spacing = [
    { step: 0, pixels: 0 }, { step: 1, pixels: 4 }, { step: 2, pixels: 8 },
    { step: 3, pixels: 12 }, { step: 4, pixels: 16 }, { step: 6, pixels: 24 },
    { step: 8, pixels: 32 }, { step: 10, pixels: 40 }, { step: 12, pixels: 48 },
    { step: 16, pixels: 64 },
  ];
  readonly name = new FormControl('', { nonNullable: true });
  readonly email = new FormControl('email-non-valida', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  readonly controlsDisabled = signal(false);
  readonly lastAction = signal('Nessuna azione selezionata.');

  readonly buttonCode = `<button matButton="filled" type="button">Save</button>
<button matButton="tonal" type="button">Preview</button>
<button matButton="outlined" type="button">Cancel</button>
<button matButton="text" type="button">Learn more</button>
<button matButton="filled" class="showcase-danger" type="button">Delete</button>
<button matIconButton type="button" aria-label="Reset examples">
  <app-icon name="reload" aria-hidden="true" />
</button>`;

  readonly inputCode = `<mat-form-field appearance="outline" class="showcase-field" subscriptSizing="dynamic">
  <mat-label>Email</mat-label>
  <input matInput type="email" autocomplete="email" [formControl]="email" />
  @if (email.hasError('required')) {
    <mat-error>Email is required.</mat-error>
  } @else if (email.hasError('email')) {
    <mat-error>Enter a valid email address.</mat-error>
  }
</mat-form-field>`;

  readonly controlCode = `import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Add the modules to the standalone component imports.
readonly email = new FormControl('', {
  nonNullable: true,
  validators: [Validators.required, Validators.email],
});

// Reactive Forms manages both value and disabled state.
// this.email.disable();
// this.email.enable();`;

  readonly tokenCode = `@use 'globals' as *;

.example-panel {
  @include surface-panel($padding: 6);
  gap: space(4);
  border-radius: radius(md);
  box-shadow: shadow(card);
  color: var(--mat-sys-on-surface);
  background: var(--mat-sys-surface);
  font: var(--mat-sys-body-large);
}`;

  readonly componentCode = `<app-feature-card
  routerLink="/basics/forms"
  iconName="form"
  title="Forms"
  description="Explore Reactive Forms."
  [features]="['Validation', 'Accessible controls']" />

<app-concept-card
  icon="◈"
  title="Design tokens"
  description="Share semantic colors across components."
  keyPointsTitle="Principles"
  [keyPoints]="['Surface and on-surface', 'Public theming APIs']" />

<app-guide-step
  [stepNumber]="1"
  title="Compose the page"
  explanation="Reuse the shared presentation components." />

<app-code-block [code]="exampleCode" language="html" />`;

  constructor() {
    this.email.markAsTouched();
  }

  toggleControls(): void {
    const disabled = !this.controlsDisabled();
    this.controlsDisabled.set(disabled);
    for (const control of [this.name, this.email]) {
      if (disabled) control.disable();
      else control.enable();
    }
  }

  resetExamples(): void {
    this.controlsDisabled.set(false);
    this.name.enable();
    this.email.enable();
    this.name.reset('');
    this.email.reset('email-non-valida');
    this.email.markAsTouched();
    this.lastAction.set('Esempi ripristinati.');
  }

  recordAction(action: string): void {
    this.lastAction.set(`Anteprima: azione ${action}.`);
  }
}
