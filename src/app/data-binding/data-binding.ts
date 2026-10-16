// COMPONENT TYPE: Container
// SECTION: Angular Basics
// ROLE: Teach binding directions through synchronized, reversible experiments.
// PATTERN: Local component state, explicit DOM events and template-driven binding.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';

@Component({
  selector: 'app-data-binding',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LessonShell,
    LessonDisclosure,
    CodeBlock,
  ],
  templateUrl: './data-binding.html',
  styleUrl: './data-binding.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DataBinding {
  name = 'Ada';
  isLocked = false;
  inputCount = 0;
  lastEvent = 'nessuno';
  status = '';

  readonly interpolationExample = `<p>Ciao, {{ name || 'visitatore' }}!</p>`;
  readonly propertyExample = `<input [value]="name" [disabled]="isLocked" readonly />
<button type="button" [attr.aria-pressed]="isLocked"
        (click)="toggleLock()">Blocca / sblocca la copia</button>`;
  readonly eventExample = `<input [value]="name" (input)="onNameInput($event)" />`;
  readonly twoWayExample = `<input [(ngModel)]="name" />
<!-- Equivalent directive bindings: -->
<input [ngModel]="name" (ngModelChange)="name = $event" />`;
  readonly completeExample = `import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-binding-demo',
  imports: [FormsModule],
  template: \`
    <p>Ciao, {{ name || 'visitatore' }}!</p>
    <label>Copia unidirezionale
      <input [value]="name" [disabled]="isLocked" readonly />
    </label>
    <button type="button" [attr.aria-pressed]="isLocked"
      (click)="toggleLock()">Blocca / sblocca la copia</button>
    <label>Evento DOM esplicito
      <input [value]="name" (input)="onNameInput($event)" />
    </label>
    <p>Ultimo evento: {{ lastEvent }}; eventi input: {{ inputCount }}</p>
    <label>Binding bidirezionale <input [(ngModel)]="name" /></label>
    <button type="button" (click)="name = 'Grace'">Usa Grace</button>
    <button type="button" (click)="reset()">Ripristina tutto</button>
  \`,
})
export class BindingDemo {
  name = 'Ada';
  isLocked = false;
  inputCount = 0;
  lastEvent = 'nessuno';

  onNameInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.name = event.target.value;
      this.lastEvent = event.type;
      this.inputCount += 1;
    }
  }

  toggleLock(): void {
    this.isLocked = !this.isLocked;
  }

  reset(): void {
    this.name = 'Ada';
    this.isLocked = false;
    this.inputCount = 0;
    this.lastEvent = 'nessuno';
  }
}`;

  onNameInput(event: Event): void {
    // Narrow EventTarget before reading the input-specific value property.
    if (event.target instanceof HTMLInputElement) {
      this.name = event.target.value;
      this.lastEvent = event.type;
      this.inputCount += 1;
    }
  }

  toggleLock(): void {
    this.isLocked = !this.isLocked;
    this.status = this.isLocked ? 'Copia unidirezionale bloccata.' : 'Copia unidirezionale sbloccata.';
  }

  usePreset(): void {
    this.name = 'Grace';
    this.status = 'Nome impostato dal componente. Tutte le viste sono aggiornate.';
  }

  reset(): void {
    this.name = 'Ada';
    this.isLocked = false;
    this.inputCount = 0;
    this.lastEvent = 'nessuno';
    this.status = 'Demo ripristinata: nome Ada, copia sbloccata e contatore azzerato.';
  }
}
