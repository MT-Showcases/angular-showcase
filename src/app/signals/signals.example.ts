import type { LessonExample } from '../components/lesson-examples/lesson-examples';
import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { CART_DIAGRAM, COMPUTED_DIAGRAM, COUNTER_DIAGRAM, EFFECT_DIAGRAM } from './signals-diagrams';

const COUNTER_SOURCES: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

// Il signal è l'unica fonte del numero: il template lo legge e si aggiorna da solo.
@Component({
  selector: 'app-signal-counter',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class SignalCounter {
  // signal(0) crea uno stato modificabile con valore iniziale zero.
  // readonly blocca la riassegnazione del campo, non il valore: set e update restano permessi.
  readonly count = signal(0);

  increment(): void {
    // update riceve il valore corrente e restituisce il prossimo.
    this.count.update(value => value + 1);
  }

  decrement(): void {
    this.count.update(value => value - 1);
  }

  reset(): void {
    // set sostituisce il valore senza leggere quello precedente.
    this.count.set(0);
  }
}`,
  html: `<section class="counter">
  <p class="counter__hint">
    Il template legge <code>count()</code>: ogni scrittura aggiorna subito il numero.
  </p>

  <!-- La lettura count() registra il template come consumatore: quando il valore cambia, Angular aggiorna il template. -->
  <p class="counter__value" aria-live="polite">{{ count() }}</p>

  <div class="counter__actions">
    <!-- (click) delega a un metodo: la logica resta nel TypeScript del componente. -->
    <button
      matButton="outlined"
      type="button"
      (click)="decrement()"
    >Diminuisci</button>

    <button
      matButton="filled"
      type="button"
      (click)="increment()"
    >Aumenta</button>

    <button
      matButton="text"
      type="button"
      (click)="reset()"
    >Azzera</button>
  </div>
</section>`,
  css: `/* I token --mat-sys-* seguono il tema Material attivo: niente colori fissi. */
.counter {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.counter__hint,
.counter__value {
  margin: 0;
}

.counter__value {
  color: var(--mat-sys-primary);
  font: var(--mat-sys-display-medium);
  text-align: center;
}

.counter__actions {
  /* flex-wrap manda i pulsanti a capo quando lo spazio non basta. */
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}`,
};

const COMPUTED_SOURCES: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

// Il doppio non ha uno stato proprio: deriva sempre dal conteggio corrente.
@Component({
  selector: 'app-signal-computed',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class SignalComputed {
  readonly count = signal(0);

  // computed legge count(): quando cambia, il valore viene ricalcolato alla lettura.
  readonly double = computed(() => this.count() * 2);
  // double non ha set: l'unico modo di cambiarlo è cambiare la sua dipendenza.

  add(step: number): void {
    this.count.update(value => value + step);
  }

  reset(): void {
    this.count.set(0);
  }
}`,
  html: `<section class="computed">
  <p class="computed__hint">
    <code>double</code> non è uno stato separato: dipende solo da <code>count</code>.
  </p>

  <div class="computed__grid">
    <!-- count() e double() sono letture: il doppio non è uno stato da sincronizzare. -->
    <div class="computed__card">
      <span class="computed__label">Conteggio</span>
      <span class="computed__value">{{ count() }}</span>
    </div>

    <div class="computed__card computed__card--derived">
      <span class="computed__label">Doppio calcolato</span>
      <span class="computed__value">{{ double() }}</span>
    </div>
  </div>

  <div class="computed__actions">
    <!-- Ogni (click) delega a un metodo del componente, con il passo come argomento. -->
    <button
      matButton="outlined"
      type="button"
      (click)="add(1)"
    >+1 al conteggio</button>

    <button
      matButton="outlined"
      type="button"
      (click)="add(10)"
    >+10 al conteggio</button>

    <button
      matButton="text"
      type="button"
      (click)="reset()"
    >Azzera</button>
  </div>
</section>`,
  css: `/* Superfici, bordi e testo arrivano dai token del tema Material. */
.computed {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.computed__hint {
  margin: 0;
}

.computed__grid {
  display: grid;
  /* auto-fit crea quante colonne entrano nello spazio; min(100%, 10rem) evita lo sbordamento. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.75rem;
}

.computed__card {
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.computed__card--derived {
  border-color: var(--mat-sys-primary);
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.computed__label {
  font: var(--mat-sys-label-large);
}

.computed__value {
  font: var(--mat-sys-headline-medium);
  font-weight: 700;
}

.computed__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}`,
};

const EFFECT_SOURCES: PlaygroundSources = {
  typescript: `import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

// L'effect collega un signal a un'API imperativa: qui il titolo della sola anteprima.
@Component({
  selector: 'app-signal-effect',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class SignalEffect {
  // inject(DOCUMENT) è il documento dell'anteprima, non la pagina che la ospita.
  readonly document = inject(DOCUMENT);

  // Il titolo attuale va salvato prima di modificarlo, per poterlo ripristinare.
  private readonly originalTitle = this.document.title;

  readonly count = signal(0);
  readonly titleSync = signal(false);

  constructor() {
    // effect richiede un contesto di iniezione: qui è il costruttore del componente.
    effect(onCleanup => {
      // Opt-in esplicito: da spento l'effetto esce prima di leggere count,
      // quindi count non entra nelle dipendenze finché la sincronizzazione resta disattivata.
      if (!this.titleSync()) return;

      this.document.title = 'Conteggio ' + this.count() + ' · Anteprima Angular';

      // onCleanup annulla la modifica prima della riesecuzione o alla distruzione.
      onCleanup(() => {
        this.document.title = this.originalTitle;
      });
    });
  }

  increment(): void {
    this.count.update(value => value + 1);
  }

  reset(): void {
    this.count.set(0);
  }

  toggleSync(): void {
    // titleSync è una dipendenza dell'effetto: cambiarlo lo esegue di nuovo.
    this.titleSync.update(enabled => !enabled);
  }
}`,
  html: `<section class="effect">
  <p class="effect__hint">
    L'effetto aggiorna il <strong>titolo della sola anteprima</strong>, non la scheda del sito.
  </p>

  <p class="effect__count" aria-live="polite">Conteggio: <strong>{{ count() }}</strong></p>

  <div class="effect__actions">
    <button
      matButton="outlined"
      type="button"
      (click)="increment()"
    >Aumenta</button>

    <button
      matButton="text"
      type="button"
      (click)="reset()"
    >Azzera</button>

    <!-- aria-pressed riflette titleSync(): il template mostra uno stato reale. -->
    <button
      matButton="filled"
      type="button"
      [attr.aria-pressed]="titleSync()"
      (click)="toggleSync()"
    >{{ titleSync() ? 'Disattiva sincronizzazione' : 'Attiva sincronizzazione' }}</button>
  </div>

  <!-- Lettura imperativa del titolo reale: non è un signal, ma mostra la scrittura dell'effetto. -->
  <p class="effect__title">Titolo dell’anteprima: <output>{{ document.title }}</output></p>

  <p class="effect__status" role="status">
    {{ titleSync() ? 'Il titolo dell’anteprima segue il conteggio.' : 'Sincronizzazione disattivata: il titolo non cambia.' }}
  </p>

  <p class="effect__note">
    Disattivando l'effetto o ricreando l'anteprima, la pulizia ripristina il titolo iniziale.
  </p>
</section>`,
  css: `/* I token del tema danno colori e raggi coerenti con Material. */
.effect {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.effect__hint,
.effect__count,
.effect__status,
.effect__title,
.effect__note {
  margin: 0;
}

.effect__count {
  color: var(--mat-sys-primary);
  font: var(--mat-sys-headline-small);
}

.effect__actions {
  /* I tre pulsanti vanno a capo invece di comprimersi su schermi stretti. */
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.effect__status {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  font: var(--mat-sys-body-medium);
}

.effect__note {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-small);
}`,
};

const CART_SOURCES: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

// L'id è l'identità stabile della riga: due prodotti possono avere lo stesso nome.
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

// Lista di partenza condivisa dal costruttore e dal ripristino.
// readonly impedisce di aggiungere o rimuovere elementi da questa lista.
const INITIAL_ITEMS: readonly CartItem[] = [
  { id: 1, name: 'Taccuino', price: 6, quantity: 1 },
  { id: 2, name: 'Penna', price: 3, quantity: 2 },
];

// Il signal conserva solo la lista: il totale è derivato e non viene copiato.
@Component({
  selector: 'app-signal-cart',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class SignalCart {
  // nextId produce identificatori unici anche per righe con lo stesso nome.
  private nextId = 3;

  // Lo spread copia ogni riga: la lista iniziale resta intatta e riutilizzabile.
  readonly items = signal<CartItem[]>(INITIAL_ITEMS.map(item => ({ ...item })));

  // reduce somma prezzo per quantità: il totale deriva dalla lista, senza un secondo stato modificabile.
  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  addItem(): void {
    const added: CartItem = { id: this.nextId++, name: 'Borraccia', price: 12, quantity: 1 };
    // Un nuovo array e un nuovo oggetto cambiano la referenza letta dal signal.
    this.items.update(items => [...items, added]);
  }

  increase(id: number): void {
    this.updateQuantity(id, 1);
  }

  decrease(id: number): void {
    this.updateQuantity(id, -1);
  }

  removeItem(id: number): void {
    // filter restituisce un nuovo array senza la riga scelta.
    this.items.update(items => items.filter(item => item.id !== id));
  }

  reset(): void {
    // Ripristino completo: contatore degli ID e copie nuove della lista iniziale.
    this.nextId = 3;
    this.items.set(INITIAL_ITEMS.map(item => ({ ...item })));
  }

  private updateQuantity(id: number, delta: number): void {
    // map sostituisce solo la riga scelta con un nuovo oggetto; il minimo è 1.
    this.items.update(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  }
}`,
  html: `<section class="cart">
  <p class="cart__hint">
    Ogni modifica crea un nuovo array e una nuova riga: il signal confronta la referenza,
    mentre <code>track item.id</code> conserva l'identità di ogni riga.
  </p>

  <ul class="cart__list">
    <!-- track item.id mantiene l'identità della riga anche quando la lista è un nuovo array. -->
    @for (item of items(); track item.id) {
      <li class="cart__item" [attr.data-item-id]="item.id">
        <div class="cart__info">
          <span class="cart__name">{{ item.name }}</span>
          <span class="cart__price">{{ item.price }} € a pezzo</span>
        </div>

        <div class="cart__row-actions">
          <!-- Il limite inferiore è 1: a quantità 1 "Meno" è disabilitato. -->
          <button
            matButton="outlined"
            type="button"
            [attr.aria-label]="'Diminuisci ' + item.name"
            [disabled]="item.quantity === 1"
            (click)="decrease(item.id)"
          >Meno</button>

          <span class="cart__quantity" [attr.aria-label]="'Quantità di ' + item.name">
            {{ item.quantity }}
          </span>

          <button
            matButton="outlined"
            type="button"
            [attr.aria-label]="'Aumenta ' + item.name"
            (click)="increase(item.id)"
          >Più</button>

          <button
            matButton="text"
            type="button"
            [attr.aria-label]="'Rimuovi ' + item.name"
            (click)="removeItem(item.id)"
          >Rimuovi</button>
        </div>
      </li>
    } @empty {
      <!-- Lista vuota: @empty mostra un messaggio al posto delle righe. -->
      <li class="cart__empty" role="status">Il carrello è vuoto: aggiungi un prodotto.</li>
    }
  </ul>

  <!-- total() legge il computed: non serve aggiornare il totale nei metodi dei pulsanti. -->
  <p class="cart__total" aria-live="polite">Totale: <strong>{{ total() }} €</strong></p>

  <div class="cart__actions">
    <button
      matButton="filled"
      type="button"
      (click)="addItem()"
    >Aggiungi borraccia</button>
    <button
      matButton="outlined"
      type="button"
      (click)="reset()"
    >Ripristina</button>
  </div>
</section>`,
  css: `/* Colori e raggi vengono dai token del tema, così l'esempio segue il brand. */
.cart {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.cart__hint,
.cart__total {
  margin: 0;
}

.cart__list {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cart__item {
  /* Su schermi stretti i comandi vanno sotto il nome invece di comprimerlo. */
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-inline-start: 0.25rem solid var(--mat-sys-primary);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.cart__info {
  display: grid;
  gap: 0.125rem;
  /* Base di 10rem: cresce o si restringe, permettendo il ritorno a capo dei comandi. */
  flex: 1 1 10rem;
  min-width: 0;
}

.cart__name {
  font: var(--mat-sys-title-medium);
  overflow-wrap: anywhere;
}

.cart__price {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-small);
}

.cart__row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.cart__quantity {
  min-width: 1.5rem;
  font: var(--mat-sys-label-large);
  text-align: center;
}

.cart__empty {
  padding: 1rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface-variant);
}

.cart__total {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
  font: var(--mat-sys-title-medium);
}

.cart__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}`,
};

/** Four independent runnable examples; each keeps its own preview state. */
export const SIGNALS_EXAMPLES: readonly LessonExample[] = [
  {
    id: 'counter',
    label: '1. Signal modificabile',
    title: 'Un signal letto dal template',
    prompt:
      'Premi **Aumenta** e **Diminuisci**: il numero cambia con `update`. **Azzera** usa `set(0)`. Il template legge `count()` e non conserva una copia del valore.',
    takeaway:
      '`signal` crea uno stato modificabile. `count()` è una lettura, `update` parte dal valore corrente e `set` lo sostituisce. Chi legge il signal viene notificato del cambiamento.',
    sources: COUNTER_SOURCES,
    diagram: COUNTER_DIAGRAM,
  },
  {
    id: 'computed',
    label: '2. Computed',
    title: 'Un valore derivato, nessuna copia',
    prompt:
      'Aumenta il conteggio di 1 e poi di 10. Il **doppio** cambia nello stesso momento: non esiste un secondo signal da mantenere allineato.',
    takeaway:
      '`computed` deriva un valore da altri signal e resta in sola lettura. Il calcolo viene invalidato quando cambia una dipendenza e rieseguito alla lettura successiva.',
    sources: COMPUTED_SOURCES,
    diagram: COMPUTED_DIAGRAM,
  },
  {
    id: 'effect',
    label: '3. Effect',
    title: 'Un effetto verso il titolo dell’anteprima',
    prompt:
      'Attiva la **sincronizzazione**, poi aumenta il conteggio e osserva il titolo dell’anteprima. Disattivala: il titolo iniziale torna subito. La scheda del sito non cambia mai.',
    takeaway:
      '`effect` serve per un’API imperativa, non per derivare stato. Le dipendenze sono le letture dell’ultima esecuzione: `onCleanup` annulla la modifica prima della riesecuzione e alla distruzione.',
    sources: EFFECT_SOURCES,
    diagram: EFFECT_DIAGRAM,
  },
  {
    id: 'cart',
    label: '4. Carrello',
    title: 'Modifiche immutabili e totale derivato',
    prompt:
      'Aumenta e diminuisci le quantità: la prima riga non scende sotto 1. Rimuovi tutto e aggiungi due borracce: hanno ID distinti. **Ripristina** riporta i dati iniziali.',
    takeaway:
      'Ogni modifica crea un nuovo array e sostituisce solo l’oggetto cambiato. `total` è un `computed`; `track item.id` conserva le righe quando la lista viene ricreata.',
    sources: CART_SOURCES,
    diagram: CART_DIAGRAM,
  },
];
