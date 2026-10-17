import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { PLAYGROUND_STYLES } from '../learning/playground-styles';

/** One state value connects interpolation, properties, DOM events and ngModel. */
export const BINDING_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-binding-demo',
  imports: [FormsModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class BindingDemo {
  // Tutti i campi leggono questo unico stato.
  name = 'Ada';
  isLocked = false;
  inputCount = 0;

  onNameInput(event: Event): void {
    // L'evento DOM contiene il campo che ha generato l'azione.
    if (event.target instanceof HTMLInputElement) {
      this.name = event.target.value;
      this.inputCount += 1;
    }
  }

  reset(): void {
    this.name = 'Ada';
    this.isLocked = false;
    this.inputCount = 0;
  }
}`,
  html: `<section class="demo">
  <!-- Interpolazione: lo stato diventa testo, anche se contiene HTML. -->
  <h2 id="greeting">Ciao, {{ name || 'visitatore' }}!</h2>

  <label>
    Copia unidirezionale (sola lettura)
    <input
      id="copy"
      [value]="name"
      [disabled]="isLocked"
      readonly
    />
  </label>

  <button
    id="lock"
    type="button"
    [attr.aria-pressed]="isLocked"
    (click)="isLocked = !isLocked"
  >
    {{ isLocked ? 'Sblocca la copia' : 'Blocca la copia' }}
  </button>

  <!-- L'evento aggiorna lo stato solo perché il metodo lo assegna. -->
  <label>
    Nome con evento DOM
    <input id="event-name" [value]="name" (input)="onNameInput($event)" />
  </label>

  <p id="events">Eventi input osservati: {{ inputCount }}</p>

  <!-- ngModel gestisce entrambe le direzioni. Richiede FormsModule. -->
  <label>
    Nome con binding bidirezionale
    <input id="two-way-name" [(ngModel)]="name" />
  </label>

  <div class="actions">
    <button id="preset" type="button" (click)="name = 'Grace'">Usa Grace</button>
    <button id="reset" type="button" (click)="reset()">Ripristina demo</button>
  </div>
</section>`,
  css: PLAYGROUND_STYLES,
};
