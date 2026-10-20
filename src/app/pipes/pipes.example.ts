import type { PlaygroundSources } from '../components/angular-playground/playground.types';

export const DATE_EXAMPLE: PlaygroundSources = {
  typescript: `import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-date-demo',
  imports: [DatePipe],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class DateDemo {
  // Il timestamp è fisso: il risultato non dipende dall'ora del computer.
  readonly timestamp = '2026-10-16T10:30:00Z';

  // La locale en-US è già disponibile; i dati italiani non sono caricati.
  dateFormat = 'yyyy-MM-dd';

  // Uno scarto fisso come +0200 non applica le regole dell'ora legale.
  timezone = 'UTC';
}`,
  html: `<div class="controls">
  <label class="field">
    Formato della data
    <select
      #formatInput
      id="date-format"
      [value]="dateFormat"
      (change)="dateFormat = formatInput.value"
    >
      <option value="yyyy-MM-dd">Anno-mese-giorno</option>
      <option value="dd/MM/yyyy">Giorno/mese/anno</option>
      <option value="fullDate">Data estesa in inglese</option>
      <option value="HH:mm">Ora e minuti</option>
    </select>
  </label>

  <label class="field">
    Fuso orario
    <select
      #timezoneInput
      id="timezone"
      [value]="timezone"
      (change)="timezone = timezoneInput.value"
    >
      <option value="UTC">UTC</option>
      <option value="+0200">Scarto fisso UTC+02:00</option>
    </select>
  </label>
</div>

<p class="source">
  Originale:
  <code id="date-raw">{{ timestamp }}</code>
</p>

<!-- La pipe riceve lo stesso timestamp e cambia solo la presentazione. -->
<p
  id="date-result"
  class="result"
  role="status"
>
  {{ timestamp | date:dateFormat:timezone:'en-US' }}
</p>

<p class="note">Il fuso UTC+02:00 è uno scarto fisso, non un calendario con ora legale.</p>`,
  css: `/* I controlli vanno a capo quando lo spazio non basta. */
.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}

select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: inherit;
  font-size: max(1rem, 16px);
}

.source {
  margin-block: 1rem 0;
  overflow-wrap: anywhere;
}

.result {
  margin-block: 1rem 0;
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.note {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-small);
  line-height: 1.6;
}`,
};

export const CURRENCY_EXAMPLE: PlaygroundSources = {
  typescript: `import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-currency-demo',
  imports: [CurrencyPipe],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class CurrencyDemo {
  // Il numero è il dato; la valuta è soltanto un'etichetta di presentazione.
  amount: number | null = 1234.5;
  currency = 'EUR';
  currencyDisplay = 'symbol';

  updateAmount(value: number): void {
    // Un campo vuoto non produce un numero: evitiamo di mostrare NaN.
    this.amount = Number.isFinite(value) ? value : null;
  }
}`,
  html: `<div class="controls">
  <label class="field">
    Importo numerico
    <input
      #amountInput
      id="amount"
      type="number"
      step="0.01"
      [value]="amount ?? ''"
      (input)="updateAmount(amountInput.valueAsNumber)"
    />
  </label>

  <label class="field">
    Valuta
    <select
      #currencyInput
      id="currency"
      [value]="currency"
      (change)="currency = currencyInput.value"
    >
      <option value="EUR">Euro</option>
      <option value="USD">Dollaro statunitense</option>
      <option value="GBP">Sterlina britannica</option>
    </select>
  </label>

  <label class="field">
    Visualizzazione
    <select
      #displayInput
      id="currency-display"
      [value]="currencyDisplay"
      (change)="currencyDisplay = displayInput.value"
    >
      <option value="symbol">Simbolo</option>
      <option value="code">Codice</option>
    </select>
  </label>
</div>

<p class="source">
  Originale:
  <code id="amount-raw">{{ amount ?? 'Nessun importo' }}</code>
</p>

@if (amount !== null) {
  <!-- Cambiare valuta modifica l'etichetta, non converte il denaro. -->
  <p
    id="currency-result"
    class="result"
    role="status"
  >
    {{ amount | currency:currency:currencyDisplay:'1.2-2':'en-US' }}
  </p>
} @else {
  <p
    id="currency-result"
    class="result"
    role="status"
  >
    Inserisci un numero per vedere il risultato.
  </p>
}

<p class="note">La locale en-US usa il punto decimale e la virgola per le migliaia. Non c'è alcun tasso di cambio.</p>`,
  css: `/* Tre campi affiancati diventano una colonna sugli schermi stretti. */
.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}

input,
select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: inherit;
  font-size: max(1rem, 16px);
}

.source {
  margin-block: 1rem 0;
  overflow-wrap: anywhere;
}

.result {
  margin-block: 1rem 0;
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.note {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-small);
  line-height: 1.6;
}`,
};

export const UPPERCASE_EXAMPLE: PlaygroundSources = {
  typescript: `import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-uppercase-demo',
  imports: [UpperCasePipe],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class UppercaseDemo {
  // Lo stato conserva il testo digitato: la pipe cambia solo la vista.
  text = 'Angular si impara provando';
}`,
  html: `<label class="field">
  Testo da presentare
  <input
    #textInput
    id="uppercase-text"
    type="text"
    maxlength="100"
    [value]="text"
    (input)="text = textInput.value"
  />
</label>

<p class="source">
  Originale:
  <span id="text-raw">{{ text || '(testo vuoto)' }}</span>
</p>

<!-- La pipe restituisce una nuova stringa senza modificare text. -->
<p
  id="uppercase-result"
  class="result"
  role="status"
>
  {{ (text | uppercase) || '(testo vuoto)' }}
</p>`,
  css: `.field {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}

input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: inherit;
  font-size: max(1rem, 16px);
}

.source {
  margin-block: 1rem 0;
  overflow-wrap: anywhere;
}

.result {
  margin-block: 1rem 0;
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font-weight: 600;
  overflow-wrap: anywhere;
}`,
};

export const TAG_LIST_EXAMPLE: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TagListPipe } from './tag-list.pipe';

@Component({
  selector: 'app-tag-list-demo',
  imports: [MatButtonModule, TagListPipe],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class TagListDemo {
  labels: readonly string[] = ['template', 'dati'];
  separator = ' · ';
  newLabel = '';

  addLabel(input: HTMLInputElement): void {
    const value = this.newLabel.trim();

    // Un'etichetta vuota non aggiunge nulla.
    if (!value) return;

    // Lo spread crea un nuovo array: la pipe pura riceve un nuovo riferimento.
    this.labels = [...this.labels, value];
    this.newLabel = '';
    input.value = '';
  }
}`,
  files: {
    'tag-list.pipe.ts': `import { Pipe, PipeTransform } from '@angular/core';

// Una pipe pura trasforma il valore senza modificare l'array originale.
@Pipe({
  name: 'tagList',
  standalone: true,
  pure: true,
})
export class TagListPipe implements PipeTransform {
  transform(labels: readonly string[], separator = ' · '): string {
    return labels.join(separator);
  }
}`,
  },
  html: `<div class="controls">
  <label class="field">
    Nuova etichetta
    <input
      #labelInput
      id="new-label"
      type="text"
      maxlength="40"
      [value]="newLabel"
      (input)="newLabel = labelInput.value"
      (keydown.enter)="addLabel(labelInput)"
    />
  </label>

  <label class="field">
    Separatore
    <select
      #separatorInput
      id="separator"
      [value]="separator"
      (change)="separator = separatorInput.value"
    >
      <option value=" · ">Punto centrale</option>
      <option value=" / ">Barra</option>
      <option value=", ">Virgola</option>
    </select>
  </label>
</div>

<button
  matButton="filled"
  type="button"
  [disabled]="!newLabel.trim()"
  (click)="addLabel(labelInput)"
>
  Aggiungi etichetta
</button>

<p class="source">
  Array originale:
  <code id="labels-raw">{{ labels }}</code>
</p>

<!-- Il parametro del separatore segue i due punti nella pipe. -->
<p
  id="labels-result"
  class="result"
  role="status"
>
  {{ labels | tagList:separator }}
</p>

<p class="note">Il pulsante resta disabilitato finché il campo contiene solo spazi.</p>`,
  css: `.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}

input,
select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: inherit;
  font-size: max(1rem, 16px);
}

button {
  margin-block-start: 1rem;
}

.source {
  margin-block: 1rem 0;
  overflow-wrap: anywhere;
}

.result {
  margin-block: 1rem 0;
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.note {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-small);
  line-height: 1.6;
}`,
};
