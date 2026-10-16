// COMPONENT TYPE: Container
// SECTION: Angular Signals
//
// ROLE:
// - Demonstrate Angular Signals API through interactive examples
// - Show writable signals, computed signals, and effects
// - Provide practical example with shopping cart
//
// PATTERNS USED:
// - Standalone component with Signals API
// - Educational code organization with clear section markers
// - Reactive state management with signals (no services needed for this demo)
// - Computed signals for derived state (automatic recalculation)
//
// NOTES FOR CONTRIBUTORS:
// - Keep examples simple and focused on signal concepts
// - Use clear section markers (═══) for educational clarity
// - Add new signal patterns as separate, well-labeled sections
// - Avoid introducing complex state management (keep it educational)

import { Component, signal, computed, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DOCUMENT } from '@angular/common';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { CodeBlock } from '../components/code-block/code-block';

@Component({
  selector: 'app-signals',
  imports: [LessonShell, LessonDisclosure, MatButtonModule, CodeBlock],
  templateUrl: './signals.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signals.scss',
})
export class Signals {
  readonly writableExample = `// Class fragment. Import signal from '@angular/core'.
count = signal(0);
// Read with count(); set replaces the value, update derives from its current value.
increment() { this.count.update(value => value + 1); }`;
  readonly computedExample = `// Class fragment. Import computed from '@angular/core'.
doubleCount = computed(() => this.count() * 2);
tripleCount = computed(() => this.count() * 3);`;
  readonly cartExample = `// Class fragment. Import signal and computed from '@angular/core'.
items = signal([{ id: 1, name: 'Magic Mouse', price: 99, quantity: 1 }]);
total = computed(() => this.items().reduce(
  (sum, item) => sum + item.price * item.quantity, 0
));
// Replace the array and the changed object; keep item IDs stable.
this.items.update(items => items.map(item => item.id === 1
  ? { ...item, quantity: item.quantity + 1 } : item));
// Template loop: @for (item of items(); track item.id) { ... }`;
  readonly effectExample = `// Component class fragment, created in an injection context.
// Import DOCUMENT from '@angular/common'; effect, inject, signal from '@angular/core'.
private readonly document = inject(DOCUMENT);
private readonly originalTitle = this.document.title;
titleSync = signal(false);
count = signal(0);
constructor() {
  effect(onCleanup => {
    if (!this.titleSync()) return;
    this.document.title = 'Contatore ' + this.count() + ' · Angular Showcase';
    onCleanup(() => { this.document.title = this.originalTitle; });
  });
}
// titleSync.set(true) opts in; false restores the title.
// Angular also runs cleanup when the component is destroyed.`;
  private readonly document = inject(DOCUMENT);
  private readonly originalTitle = this.document.title;
  readonly titleSync = signal(false);
  readonly toggle = (value: boolean): boolean => !value;
  private nextId = 4;
  readonly titleStatus = computed(() => this.titleSync()
    ? 'Contatore ' + this.count() + ' · Angular Showcase' : 'Sincronizzazione disattivata');

  // ═══════════════════════════════════════════════════════════════════
  // 1. WRITABLE SIGNAL - Signal that can be modified
  // ═══════════════════════════════════════════════════════════════════
  // Creates a signal with initial value 0
  // Signals are reactive: when the value changes, Angular automatically updates the template
  count = signal(0);

  increment() {
    // .update() receives a function that takes the current value and returns the new value
    this.count.update((value) => value + 1);
  }

  decrement() {
    this.count.update((value) => value - 1);
  }

  reset() {
    // .set() directly sets a new value without reading the previous one
    this.count.set(0);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. COMPUTED SIGNAL - Derived from other signals (reactive)
  // ═══════════════════════════════════════════════════════════════════
  // A dependency change invalidates the cache; the next read recomputes lazily.
  // They are read-only and memoize the result to avoid unnecessary calculations
  doubleCount = computed(() => this.count() * 2);
  tripleCount = computed(() => this.count() * 3);

  // ═══════════════════════════════════════════════════════════════════
  // 3. PRACTICAL EXAMPLE - Shopping cart with calculated total
  // ═══════════════════════════════════════════════════════════════════
  // Signal containing an array of objects (cart items)
  items = signal([
    { id: 1, name: 'MacBook Pro', price: 2499, quantity: 1 },
    { id: 2, name: 'iPhone 15', price: 999, quantity: 2 },
    { id: 3, name: 'AirPods Pro', price: 249, quantity: 1 },
  ]);

  // Computed that automatically calculates total whenever items changes
  // Keep the total derived from items rather than synchronizing a second writable value.
  total = computed(() => {
    return this.items().reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  addItem() {
    this.items.update((currentItems) => [
      ...currentItems,
      { id: this.nextId++, name: 'Magic Mouse', price: 99, quantity: 1 },
    ]);
  }

  removeItem(id: number) {
    this.items.update((currentItems) => currentItems.filter(item => item.id !== id));
  }

  updateQuantity(id: number, delta: number) {
    // Update item quantity by creating a new array (immutability)
    // Math.max(0, ...) prevents negative quantities
    this.items.update((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
    );
  }

  resetCart(): void {
    this.nextId = 4;
    this.items.set([
      { id: 1, name: 'MacBook Pro', price: 2499, quantity: 1 },
      { id: 2, name: 'iPhone 15', price: 999, quantity: 2 },
      { id: 3, name: 'AirPods Pro', price: 249, quantity: 1 },
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. EFFECT - Executes side effects when signals change
  // ═══════════════════════════════════════════════════════════════════
  effectLogs = signal<string[]>([]);

  constructor() {
    effect(onCleanup => {
      if (!this.titleSync()) return;
      this.document.title = 'Contatore ' + this.count() + ' · Angular Showcase';
      onCleanup(() => { this.document.title = this.originalTitle; });
    });
    // This separate bounded log is educational instrumentation, not state derivation.
    // Effect: executes automatically when signals used inside it change
    // Use computed for derived state; effects connect to imperative APIs.
    effect(() => {
      const currentCount = this.count();
      const log = `Conteggio aggiornato: ${currentCount}`;
      // Keep only last 5 logs to avoid overflow
      this.effectLogs.update((logs) => [...logs.slice(-4), log]);
    });
  }
}
