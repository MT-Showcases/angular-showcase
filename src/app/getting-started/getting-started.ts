// COMPONENT TYPE: Container
// SECTION: Angular Basics
// ROLE: Introduce component anatomy through reversible local state and styling.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';

@Component({
  selector: 'app-getting-started',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, CodeBlock, LessonDisclosure, LessonShell],
  templateUrl: './getting-started.html',
  styleUrl: './getting-started.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GettingStarted {
  message = 'Ciao, Angular!';
  count = 0;
  highlighted = false;
  status = '';

  readonly componentExample = `// Complete file: welcome-card.ts
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-welcome-card',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './welcome-card.html',
  styleUrl: './welcome-card.scss',
})
export class WelcomeCard {
  message = 'Ciao, Angular!';
  count = 0;
  highlighted = false;

  updateMessage(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.message = event.target.value;
    }
  }

  reset(): void {
    this.message = 'Ciao, Angular!';
    this.count = 0;
    this.highlighted = false;
  }
}`;
  readonly templateExample = `<!-- Complete file: welcome-card.html -->
<mat-form-field appearance="outline">
  <mat-label>Testo del componente</mat-label>
  <input matInput [value]="message" (input)="updateMessage($event)" />
</mat-form-field>
<section class="welcome-card" [class.welcome-card--highlighted]="highlighted">
  <h2 class="welcome-card__title">{{ message || 'Scrivi un messaggio' }}</h2>
  <p>Conteggio locale: {{ count }}</p>
</section>
<button matButton="filled" type="button" (click)="count = count + 1">Aggiungi 1</button>
<button matButton="outlined" type="button" [attr.aria-pressed]="highlighted"
  (click)="highlighted = !highlighted">Evidenzia scheda</button>
<button matButton="outlined" type="button" (click)="reset()">Ripristina tutto</button>`;
  readonly styleExample = `/* Complete file: welcome-card.scss inside this Showcase project. */
@use 'globals' as *;

.welcome-card {
  padding: space(4);
  border: rem(2) solid var(--mat-sys-outline);
  border-radius: radius(md);
  color: var(--mat-sys-on-surface);
  background: var(--mat-sys-surface);

  &--highlighted {
    border-color: var(--mat-sys-primary);
    color: var(--mat-sys-on-primary-container);
    background: var(--mat-sys-primary-container);
  }

  &__title { overflow-wrap: anywhere; }
}`;
  readonly hostExample = `// Complete host component inside an existing Angular application.
import { Component } from '@angular/core';
import { WelcomeCard } from './welcome-card';

@Component({
  selector: 'app-welcome-host',
  imports: [WelcomeCard],
  template: '<app-welcome-card />',
})
export class WelcomeHost {}`;
  readonly cleanupExample = `// Optional class fragment: imports from '@angular/core'.
private readonly destroyRef = inject(DestroyRef);

constructor() {
  const intervalId = window.setInterval(() => console.log('tick'), 1000);
  this.destroyRef.onDestroy(() => window.clearInterval(intervalId));
}`;

  updateMessage(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.message = event.target.value;
    }
  }

  increment(): void {
    this.count += 1;
    this.status = `Conteggio aggiornato: ${this.count}.`;
  }

  toggleHighlight(): void {
    this.highlighted = !this.highlighted;
    this.status = this.highlighted ? 'Scheda evidenziata.' : 'Evidenziazione rimossa.';
  }

  reset(): void {
    this.message = 'Ciao, Angular!';
    this.count = 0;
    this.highlighted = false;
    this.status = 'Demo ripristinata: messaggio iniziale, conteggio zero e stile normale.';
  }
}
