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

import { Component, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { PageHeader } from '../page-header/page-header';
import { CodeBlock } from '../components/code-block/code-block';

@Component({
  selector: 'app-signals',
  imports: [PageHeader, MatButtonModule, CodeBlock],
  templateUrl: './signals.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signals.scss',
})
export class Signals {
  readonly writableExample = `count = signal(0);
increment() { this.count.update(value => value + 1); }`;
  readonly computedExample = `doubleCount = computed(() => this.count() * 2);
tripleCount = computed(() => this.count() * 3);`;
  readonly cartExample = `items = signal([{ name: 'Magic Mouse', price: 99, quantity: 1 }]);
total = computed(() => this.items().reduce(
  (sum, item) => sum + item.price * item.quantity, 0
));`;
  readonly effectExample = `effect(() => {
  console.log('Count:', this.count());
});`;

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
  // Computed signals automatically recalculate when their dependent signals change
  // They are read-only and memoize the result to avoid unnecessary calculations
  doubleCount = computed(() => this.count() * 2);
  tripleCount = computed(() => this.count() * 3);

  // ═══════════════════════════════════════════════════════════════════
  // 3. PRACTICAL EXAMPLE - Shopping cart with calculated total
  // ═══════════════════════════════════════════════════════════════════
  // Signal containing an array of objects (cart items)
  items = signal([
    { name: 'MacBook Pro', price: 2499, quantity: 1 },
    { name: 'iPhone 15', price: 999, quantity: 2 },
    { name: 'AirPods Pro', price: 249, quantity: 1 },
  ]);

  // Computed that automatically calculates total whenever items changes
  // This is much more efficient than manually recalculating total after each modification
  total = computed(() => {
    return this.items().reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  addItem() {
    this.items.update((currentItems) => [
      ...currentItems,
      { name: 'Magic Mouse', price: 99, quantity: 1 },
    ]);
  }

  removeItem(index: number) {
    this.items.update((currentItems) => currentItems.filter((_, i) => i !== index));
  }

  updateQuantity(index: number, delta: number) {
    // Update item quantity by creating a new array (immutability)
    // Math.max(0, ...) prevents negative quantities
    this.items.update((currentItems) =>
      currentItems.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. EFFECT - Executes side effects when signals change
  // ═══════════════════════════════════════════════════════════════════
  effectLogs = signal<string[]>([]);

  constructor() {
    // Effect: executes automatically when signals used inside it change
    // Useful for logging, analytics, API calls, localStorage, etc.
    effect(() => {
      const currentCount = this.count();
      const log = `Conteggio aggiornato: ${currentCount}`;
      // Keep only last 5 logs to avoid overflow
      this.effectLogs.update((logs) => [...logs.slice(-4), log]);
    });
  }
}
