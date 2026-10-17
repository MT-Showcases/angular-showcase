import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { PLAYGROUND_STYLES } from '../learning/playground-styles';

/** Reachable branches, stable row identity and a local attribute directive. */
export const CONTROL_FLOW_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, Directive, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Una direttiva aggiunge un comportamento a un elemento esistente.
@Directive({
  selector: '[appHighlight]',
  host: { '[class.active]': 'appHighlight' },
})
class Highlight {
  @Input() appHighlight = false;
}

@Component({
  selector: 'app-control-flow-demo',
  imports: [FormsModule, Highlight],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ControlFlowDemo {
  showMessage = true;
  state = 'draft';
  highlighted = false;
  name = '';
  items = this.initialItems();
  private nextId = 4;

  add(): void {
    const name = this.name.trim();
    if (!name || name.length > 80) return;

    // L'ID identifica il dato: non dipende dalla posizione nella lista.
    this.items = [...this.items, { id: this.nextId++, name }];
    this.name = '';
  }

  remove(id: number): void {
    this.items = this.items.filter(item => item.id !== id);
  }

  reverse(): void {
    this.items = [...this.items].reverse();
  }

  reset(): void {
    this.items = this.initialItems();
    this.name = '';
  }

  private initialItems() {
    return [
      { id: 1, name: 'Mela' },
      { id: 2, name: 'Banana' },
      { id: 3, name: 'Arancia' },
    ];
  }
}`,
  html: `<section class="demo">
  <h2>Una lista, più rami da esplorare</h2>

  <button type="button" [attr.aria-pressed]="showMessage" (click)="showMessage = !showMessage">
    Mostra messaggio
  </button>

  <!-- @if crea o rimuove il contenuto dal DOM. -->
  @if (showMessage) {
    <p id="condition" class="result">Il ramo &#64;if è visibile.</p>
  } @else {
    <p id="condition" class="result">Ora stai leggendo il ramo &#64;else.</p>
  }

  <label>
    Nuovo elemento (massimo 80 caratteri)
    <input #addField id="item-name" [(ngModel)]="name" maxlength="80" />
  </label>

  <div class="actions">
    <button id="add" type="button" [disabled]="!name.trim()" (click)="add()">Aggiungi</button>
    <button id="reverse" type="button" [disabled]="items.length < 2" (click)="reverse()">Inverti ordine</button>
    <button id="clear" type="button" (click)="items = []">Svuota</button>
    <button id="reset" type="button" (click)="reset()">Ripristina lista</button>
  </div>

  <!-- track conserva il nodo di ogni elemento anche dopo un riordino. -->
  <ul aria-label="Lista della spesa" aria-live="polite">
    @for (item of items; track item.id; let position = $index) {
      <li [attr.data-item-id]="item.id">
        {{ position + 1 }}. {{ item.name }} — ID {{ item.id }}
        <button
          type="button"
          [attr.aria-label]="'Rimuovi ' + item.name + ', ID ' + item.id"
          (click)="remove(item.id); addField.focus()"
        >Rimuovi</button>
      </li>
    } @empty {
      <li id="empty">La lista è vuota: ramo &#64;empty.</li>
    }
  </ul>

  <label>
    Stato della pubblicazione
    <select id="state" [(ngModel)]="state">
      <option value="draft">Bozza</option>
      <option value="review">In revisione</option>
      <option value="published">Pubblicato</option>
      <option value="unknown">Sconosciuto</option>
    </select>
  </label>

  <!-- @switch sceglie un solo caso; @default copre gli altri valori. -->
  <div id="publication" class="result">
    @switch (state) {
      @case ('draft') { <p>Bozza: puoi modificare.</p> }
      @case ('review') { <p>In revisione: controlla il contenuto.</p> }
      @case ('published') { <p>Pubblicato: il contenuto è visibile.</p> }
      @default { <p>Stato sconosciuto: scegli uno stato valido.</p> }
    }
  </div>

  <button type="button" [attr.aria-pressed]="highlighted" (click)="highlighted = !highlighted">
    Attiva direttiva
  </button>
  <p id="highlight" [appHighlight]="highlighted">La direttiva modifica la classe di questo paragrafo.</p>
</section>`,
  css: PLAYGROUND_STYLES,
};
