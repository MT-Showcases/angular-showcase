import type { PlaygroundSources } from '../components/angular-playground/playground.types';

export const IF_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-example',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ConditionDemo {
  // Cambia il booleano: Angular sceglie quale ramo creare nel DOM.
  visible = true;
}`,
  html: `<!-- Il clic cambia soltanto lo stato: Angular aggiorna il template. -->
<button
  matButton="filled"
  type="button"
  [attr.aria-pressed]="visible"
  (click)="visible = !visible"
>
  Mostra il saluto
</button>

<!-- Quando visible è false, questo primo paragrafo non esiste nel DOM. -->
@if (visible) {
  <p id="greeting" class="result">Ciao, Angular!</p>
} @else {
  <p id="alternative" class="result">Il saluto è nascosto.</p>
}`,
  css: `/* Cambia l'aspetto dei messaggi senza cambiare la condizione. */
.result {
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  color: var(--mat-sys-on-secondary-container);
  background: var(--mat-sys-secondary-container);
}`,
};

export const FOR_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-example',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ListDemo {
  // Gli ID restano associati ai dati anche quando cambia l'ordine.
  items = this.initialItems();

  reverse(): void {
    this.items = [...this.items].reverse();
  }

  reset(): void {
    this.items = this.initialItems();
  }

  private initialItems() {
    return [
      { id: 1, name: 'Mela' },
      { id: 2, name: 'Banana' },
      { id: 3, name: 'Arancia' },
    ];
  }
}`,
  html: `<div class="actions">
  <button
    matButton="filled"
    id="reverse"
    type="button"
    (click)="reverse()"
  >Inverti ordine</button>
  <button
    matButton="outlined"
    id="clear"
    type="button"
    (click)="items = []"
  >Svuota</button>
  <button
    matButton="outlined"
    id="reset"
    type="button"
    (click)="reset()"
  >Ripristina lista</button>
</div>

<ul aria-label="Frutta" aria-live="polite">
  <!-- track usa l'ID per riconoscere ogni elemento, non la sua posizione. -->
  @for (item of items; track item.id) {
    <li [attr.data-item-id]="item.id">{{ item.name }} — ID {{ item.id }}</li>
  } @empty {
    <!-- Questo blocco appare solo quando items non contiene elementi. -->
    <li id="empty">La lista è vuota.</li>
  }
</ul>`,
  css: `/* I controlli vanno a capo sui display stretti. */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

li {
  margin-block: 0.5rem;
}`,
};

export const SWITCH_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-example',
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class StatusDemo {
  // Prova anche un valore non previsto: verrà mostrato @default.
  state = 'draft';
}`,
  html: `<label>
  Stato dell'articolo
  <select #choice id="state" (change)="state = choice.value">
    <option value="draft">Bozza</option>
    <option value="review">In revisione</option>
    <option value="published">Pubblicato</option>
    <option value="unknown">Altro valore</option>
  </select>
</label>

<!-- Angular mostra soltanto il caso corrispondente a state. -->
<div id="publication" class="result" role="status">
  @switch (state) {
    @case ('draft') { <p>Bozza: puoi scrivere.</p> }
    @case ('review') { <p>In revisione: controlla il testo.</p> }
    @case ('published') { <p>Pubblicato: il testo è visibile.</p> }
    @default { <p>Stato sconosciuto.</p> }
  }
</div>`,
  css: `label {
  display: grid;
  gap: 0.5rem;
}

.result {
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  color: var(--mat-sys-on-secondary-container);
  background: var(--mat-sys-secondary-container);
}`,
};

export const DIRECTIVE_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, Directive, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

// Il selettore riconosce l'attributo appHighlight nel template.
// La direttiva aggiunge un comportamento al pulsante, senza creare una nuova vista.
@Directive({
  selector: '[appHighlight]',
  host: {
    // Applica la classe CSS soltanto quando highlighted è true.
    '[class.highlighted]': 'highlighted',

    // Espone lo stato anche a chi usa un lettore di schermo.
    '[attr.aria-pressed]': 'highlighted',

    // Ogni clic inverte lo stato locale di questa direttiva.
    '(click)': 'highlighted = !highlighted',
  },
})
class Highlight {
  highlighted = false;
}

@Component({
  selector: 'app-directive-demo',

  // L'import rende la direttiva disponibile in questo template.
  imports: [Highlight, MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class DirectiveDemo {}`,
  html: `<!-- appHighlight attiva la direttiva sul pulsante esistente. -->
<!-- Anche Invio e Spazio producono il clic, grazie al pulsante nativo. -->
<button
  matButton="filled"
  appHighlight
  type="button"
>
  Clicca per evidenziarmi
</button>`,
  css: `/* La direttiva sceglie QUANDO aggiungere la classe; il CSS decide l'aspetto. */
.highlighted {
  outline: 3px dashed var(--mat-sys-primary);
  outline-offset: 4px;
}`,
};
