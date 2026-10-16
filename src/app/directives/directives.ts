// COMPONENT TYPE: Container
// SECTION: Angular Basics
// ROLE: Teach built-in control flow, native bindings and a real attribute directive separately.
// PATTERNS USED: Standalone lesson, stable item identity and progressive optional explanations.
// NOTES FOR CONTRIBUTORS: Keep every branch reachable; do not replace stable IDs with array indices.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { LessonHighlight } from './lesson-highlight';

interface LearningItem {
  readonly id: number;
  readonly name: string;
}

type PublicationState = 'draft' | 'review' | 'published' | 'unknown';

@Component({
  selector: 'app-directives',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, CodeBlock, LessonShell, LessonDisclosure, LessonHighlight],
  templateUrl: './directives.html',
  styleUrl: './directives.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Directives {
  showMessage = true;
  isLoggedIn = false;
  items = this.initialItems();
  newItemName = '';
  listStatus = 'La lista contiene 3 elementi.';
  publicationState: PublicationState = 'draft';
  isActive = false;
  usePrimaryColor = false;
  isHighlighted = false;
  private nextId = 4;

  readonly conditionCode = `@if (showMessage) {
  <p>Il messaggio è visibile.</p>
}
@if (isLoggedIn) {
  <p>Benvenuto!</p>
} @else {
  <p>Accedi per continuare.</p>
}`;
  readonly listCode = `@for (item of items; track item.id; let position = $index) {
  <li>{{ position + 1 }}. {{ item.name }} — ID {{ item.id }}</li>
} @empty {
  <li>La lista è vuota.</li>
}`;
  readonly listStateCode = `// IDs belong to the data, not to the visual position.
items = [{ id: 1, name: 'Mela' }, { id: 2, name: 'Banana' }];
private nextId = 3;

addItem(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  this.items = [...this.items, { id: this.nextId++, name: trimmed }];
}

removeItem(id: number): void {
  this.items = this.items.filter(item => item.id !== id);
}

reverseItems(): void {
  this.items = [...this.items].reverse();
}
// Educational core: the live demo also resets the field and announces updates.`;
  readonly highlightStyleCode = `.lesson-highlighted {
  color: var(--mat-sys-on-secondary-container);
  background: var(--mat-sys-secondary-container);
  outline: 0.125em solid var(--mat-sys-secondary);
}`;
  readonly switchCode = `@switch (publicationState) {
  @case ('draft') { <p>Bozza: puoi modificare il contenuto.</p> }
  @case ('review') { <p>In revisione: controlla il contenuto.</p> }
  @case ('published') { <p>Pubblicato: il contenuto è visibile.</p> }
  @default { <p>Stato sconosciuto: scegli uno stato valido.</p> }
}`;
  readonly bindingCode = `<p [class.active]="isActive">Classe CSS condizionale</p>
<p [style.color]="usePrimaryColor ? 'var(--mat-sys-primary)' : 'var(--mat-sys-on-surface)'">
  Colore dinamico
</p>
<p [appLessonHighlight]="isHighlighted">Una vera direttiva locale</p>`;
  readonly directiveCode = `import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appLessonHighlight]',
  host: { '[class.lesson-highlighted]': 'appLessonHighlight()' },
})
export class LessonHighlight {
  readonly appLessonHighlight = input(false);
}
// Import LessonHighlight in the consuming component's imports.
// Define .lesson-highlighted in that component's stylesheet.`;

  addItem(): void {
    const name = this.newItemName.trim();
    if (!name || name.length > 80) return;
    this.items = [...this.items, { id: this.nextId++, name }];
    this.newItemName = '';
    this.listStatus = `Aggiunto ${name}. La lista contiene ${this.items.length} elementi.`;
  }

  removeItem(id: number): void {
    const item = this.items.find(item => item.id === id);
    this.items = this.items.filter(item => item.id !== id);
    this.listStatus = `Rimosso ${item?.name ?? 'elemento'}. La lista contiene ${this.items.length} elementi.`;
  }

  reverseItems(): void {
    this.items = [...this.items].reverse();
    this.listStatus = 'Ordine invertito: gli ID e gli elementi del DOM restano gli stessi.';
  }

  clearItems(): void {
    this.items = [];
    this.listStatus = 'Lista svuotata. Ora viene mostrato il blocco @empty.';
  }

  resetItems(): void {
    this.items = this.initialItems();
    this.newItemName = '';
    this.listStatus = 'Lista iniziale ripristinata: 3 elementi.';
  }

  private initialItems(): LearningItem[] {
    return [{ id: 1, name: 'Mela' }, { id: 2, name: 'Banana' }, { id: 3, name: 'Arancia' }];
  }
}
