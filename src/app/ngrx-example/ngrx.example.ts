import type { LessonExample } from '../components/lesson-examples/lesson-examples';
import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { COUNTER_STORE_DIAGRAM, TODO_STORE_DIAGRAM } from './ngrx-diagrams';

// DEVTOOLS: journal e metaReducer condivisi, fuori dallo stato di dominio.
const DEVTOOLS_JOURNAL = `import { signal } from '@angular/core';
import type { Action, MetaReducer } from '@ngrx/store';

// La cronologia è un signal di modulo: ogni preview ricarica i file e parte vuota.
// Non vive dentro lo Store, quindi gli snapshot non contengono se stessi.
export const MAX_DEVTOOLS_ENTRIES = 8;

export interface DevtoolsChange {
  path: string;
  before: string;
  after: string;
}

export interface DevtoolsEntry {
  id: number;
  type: string;
  // null per l'inizializzazione; JSON compatto per un'azione senza payload.
  payload: string | null;
  // null all'inizializzazione: non esiste ancora uno stato precedente.
  before: string | null;
  after: string;
  changes: DevtoolsChange[];
}

const entries = signal<readonly DevtoolsEntry[]>([]);
const selectedId = signal<number | null>(null);
const liveState = signal('{}');
let nextEntryId = 1;

export const devtools = {
  entries: entries.asReadonly(),
  selectedId: selectedId.asReadonly(),
  liveState: liveState.asReadonly(),

  select(id: number): void {
    // La selezione è solo ispezione: non ripristina lo stato salvato.
    selectedId.set(id);
  },

  clear(): void {
    // Svuota soltanto il journal: conteggio, attività e stato live restano uguali.
    entries.set([]);
    selectedId.set(null);
  },
};

function snapshot(value: unknown): string {
  // JSON.stringify cattura il valore in quel momento e crea una copia immutabile.
  // Funziona perché questi esempi usano solo numeri, stringhe, booleani,
  // array e oggetti semplici; Date, Map o classi perderebbero informazioni.
  return JSON.stringify(value, null, 2) ?? 'undefined';
}

function payloadOf(action: Action): string {
  // Tutte le proprietà oltre a type formano il payload reale dell'azione.
  const payload: Record<string, unknown> = { ...action };
  delete payload['type'];

  // Un'azione con emptyProps() produce {}, non undefined: il pannello la mostra.
  return JSON.stringify(payload);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compare(before: unknown, after: unknown, path: string, changes: DevtoolsChange[]): void {
  if (before === after) return;

  // Gli oggetti semplici vengono percorsi per mostrare il percorso preciso.
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of keys) {
      compare(before[key], after[key], path ? path + '.' + key : key, changes);
    }

    return;
  }

  // Confrontiamo i valori, non i riferimenti: due array uguali non sono una modifica.
  const beforeText = before === undefined ? 'assente' : JSON.stringify(before);
  const afterText = after === undefined ? 'assente' : JSON.stringify(after);
  if (beforeText === afterText) return;

  changes.push({
    path: path || 'state',
    before: beforeText,
    after: afterText,
  });
}

export function diffStates(before: unknown, after: unknown): DevtoolsChange[] {
  const changes: DevtoolsChange[] = [];
  compare(before, after, '', changes);
  return changes;
}

function record(entry: Omit<DevtoolsEntry, 'id'>): void {
  const previousEntries = entries();
  const latest = previousEntries[previousEntries.length - 1];

  // Se stavi seguendo l'azione più recente, la nuova voce prende il testimone.
  const followsLatest = selectedId() === null || selectedId() === latest?.id;

  const nextEntry: DevtoolsEntry = { id: nextEntryId, ...entry };
  nextEntryId += 1;

  // slice(-8) limita la cronologia, non lo stato dello Store.
  const kept = [...previousEntries, nextEntry].slice(-MAX_DEVTOOLS_ENTRIES);
  entries.set(kept);

  const selectionStillThere = kept.some(candidate => candidate.id === selectedId());

  // Una selezione eliminata ripiega sulla voce valida più recente.
  if (!selectionStillThere || followsLatest) {
    selectedId.set(nextEntry.id);
  }
}

export const devtoolsMetaReducer: MetaReducer = reducer => (state, action) => {
  // Catturiamo il prima prima del calcolo; gli snapshot restano stringhe immutabili.
  const before = state === undefined ? null : snapshot(state);
  const next = reducer(state, action);
  const after = snapshot(next);
  const isInitialization = before === null;

  // La tab Stato legge sempre l'ultimo stato, anche per azioni non selezionate.
  liveState.set(after);

  // Le altre azioni interne di NgRx non sono eventi didattici: le saltiamo.
  // Registriamo l'inizializzazione una volta, senza uno stato precedente.
  if (action.type.startsWith('@ngrx/store/') && !isInitialization) return next;

  record({
    // Conserviamo il tipo originale anche per @ngrx/store/init.
    type: action.type,
    payload: isInitialization ? null : payloadOf(action),
    before,
    after,
    // Il confronto usa esattamente le copie mostrate, senza leggere riferimenti vivi.
    changes: diffStates(before === null ? {} : JSON.parse(before), JSON.parse(after)),
  });

  return next;
};
`;

// INSPECTOR: componente condiviso dalle due preview, con tab Material reali.
const DEVTOOLS_INSPECTOR_TS = `import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { devtools, type DevtoolsEntry } from './devtools';

@Component({
  selector: 'app-devtools-inspector',
  imports: [MatButtonModule, MatTabsModule],
  templateUrl: './devtools-inspector.html',
  styleUrl: './devtools-inspector.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DevtoolsInspector {
  // Il journal è lo stesso del metaReducer: qui viene solo letto.
  readonly entries = devtools.entries;
  readonly selectedId = devtools.selectedId;
  readonly liveState = devtools.liveState;

  readonly selected = computed<DevtoolsEntry | null>(() => {
    const id = this.selectedId();
    return this.entries().find(entry => entry.id === id) ?? null;
  });

  readonly changes = computed(() => this.selected()?.changes ?? []);

  select(id: number): void {
    // Cambia solo la voce ispezionata; lo Store non riceve alcuna azione.
    devtools.select(id);
  }

  clear(): void {
    // Pulisce esclusivamente la cronologia del DevTools.
    devtools.clear();
  }
}
`;

const DEVTOOLS_INSPECTOR_HTML = `<section class="devtools" aria-label="DevTools didattici">
  <header class="devtools__header">
    <div class="devtools__heading">
      <h3 class="devtools__title">DevTools didattici</h3>

      <p class="devtools__caption">
        Segui le ultime <strong>8 azioni</strong>. Seleziona un evento per esplorare il payload
        e lo stato prima e dopo.
      </p>
    </div>

    <!-- Pulisce solo la cronologia: lo Store e lo stato live non vengono toccati. -->
    <button
      matButton="outlined"
      type="button"
      aria-label="Pulisci la cronologia DevTools"
      [disabled]="entries().length === 0"
      (click)="clear()"
    >
      Pulisci cronologia
    </button>
  </header>

  <section class="devtools__history" aria-label="Azioni registrate">
    @if (entries().length === 0) {
      <p class="devtools__empty">Nessuna azione registrata: la cronologia è vuota.</p>
    } @else {
      <!-- Ogni voce è un pulsante reale: selezione accessibile anche da tastiera. -->
      <ol class="devtools__list">
        @for (entry of entries(); track entry.id) {
          <li class="devtools__item">
            <button
              [matButton]="entry.id === selectedId() ? 'outlined' : 'text'"
              class="devtools__select"
              type="button"
              [attr.aria-label]="'Ispeziona azione ' + entry.id + ' ' + entry.type"
              [attr.aria-pressed]="entry.id === selectedId()"
              (click)="select(entry.id)"
            >
              <span class="devtools__entry-type">{{ entry.type }}</span>
              <span class="devtools__entry-id">#{{ entry.id }}</span>
            </button>
          </li>
        }
      </ol>
    }
  </section>

  <!-- Le tab Material gestiscono navigazione da tastiera e pannelli accessibili. -->
  <mat-tab-group
    animationDuration="0ms"
    [preserveContent]="true"
    class="devtools__tabs"
  >
    <mat-tab label="Azione">
      <div class="devtools__panel" aria-label="Dettaglio azione selezionata">
        @if (selected(); as entry) {
          <p class="devtools__selected">
            Azione selezionata:
            <code class="devtools__type">{{ entry.type }}</code>
          </p>

          <h4 class="devtools__label">Payload</h4>
          <pre class="devtools__json devtools__payload">{{ entry.payload ?? 'Nessun payload (azione senza dati)' }}</pre>

          <h4 class="devtools__label">Stato precedente</h4>
          <pre class="devtools__json devtools__before">{{ entry.before ?? 'Nessuno stato precedente' }}</pre>

          <h4 class="devtools__label">Stato successivo</h4>
          <pre class="devtools__json devtools__after">{{ entry.after }}</pre>

          <p class="devtools__note">
            Gli snapshot sono copie JSON del momento. Ispezionare una voce non ripristina lo stato
            selezionato.
          </p>
        } @else {
          <p class="devtools__empty">Seleziona un'azione dalla cronologia per vedere payload e stati.</p>
        }
      </div>
    </mat-tab>

    <mat-tab label="Stato">
      <div class="devtools__panel" aria-label="Stato attuale dello Store">
        <p class="devtools__note">
          Stato attuale dello Store: è sempre quello live, anche mentre guardi un'azione precedente.
        </p>

        <pre class="devtools__json devtools__live">{{ liveState() }}</pre>
      </div>
    </mat-tab>

    <mat-tab label="Modifiche">
      <div class="devtools__panel" aria-label="Modifiche dell'azione selezionata">
        @if (selected(); as entry) {
          <p class="devtools__selected">
            Confronto dell'azione:
            <code class="devtools__type">{{ entry.type }}</code>
          </p>

          @if (changes().length === 0) {
            <p class="devtools__empty">
              Nessuna variazione: questa azione ha lasciato lo stato uguale.
            </p>
          } @else {
            <ul class="devtools__changes">
              @for (change of changes(); track change.path) {
                <li class="devtools__change">
                  <code class="devtools__path">{{ change.path }}</code>

                  <p class="devtools__change-line">
                    <span class="devtools__change-label">Prima</span>
                    <code class="devtools__old">{{ change.before }}</code>
                  </p>

                  <p class="devtools__change-line">
                    <span class="devtools__change-label">Dopo</span>
                    <code class="devtools__new">{{ change.after }}</code>
                  </p>
                </li>
              }
            </ul>
          }
        } @else {
          <p class="devtools__empty">Seleziona un'azione per confrontare gli stati.</p>
        }
      </div>
    </mat-tab>
  </mat-tab-group>
</section>`;

const DEVTOOLS_INSPECTOR_CSS = `/* I token Material mantengono leggibile il pannello nel tema attivo. */
.devtools {
  display: grid;
  gap: 1rem;
  align-content: start;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container);
  color: var(--mat-sys-on-surface);
}

.devtools__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.devtools__heading {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.devtools__title {
  margin: 0;
  font: var(--mat-sys-title-medium);
  overflow-wrap: anywhere;
}

.devtools__caption,
.devtools__note,
.devtools__empty {
  margin: 0;
  font: var(--mat-sys-body-small);
  overflow-wrap: anywhere;
}

.devtools__caption,
.devtools__note {
  color: var(--mat-sys-on-surface-variant);
}

/* La cronologia usa una coppia container/on-container distinta dallo stato live. */
.devtools__history {
  min-width: 0;
  padding: 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}

.devtools__list {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.devtools__item {
  min-width: 0;
}

/* Il pulsante Material resta reale; qui il testo lungo può andare a capo. */
.devtools__select {
  max-width: 100%;
  min-width: 0;
  height: auto;
  min-height: 2.75rem;
  white-space: normal;
  text-align: left;
}

.devtools__entry-type {
  overflow-wrap: anywhere;
}

.devtools__entry-id {
  margin-left: 0.25rem;
  font: var(--mat-sys-label-small);
}

.devtools__tabs {
  min-width: 0;
}

/* Il pannello contiene JSON: lo spazio resta interno e non allarga la pagina. */
.devtools__panel {
  display: grid;
  gap: 0.375rem;
  min-width: 0;
  padding: 0.75rem 0;
}

.devtools__selected {
  margin: 0;
  overflow-wrap: anywhere;
}

.devtools__type,
.devtools__path {
  overflow-wrap: anywhere;
}

.devtools__label {
  margin: 0;
  font: var(--mat-sys-label-large);
}

.devtools__json {
  max-width: 100%;
  max-height: 14rem;
  margin: 0;
  overflow: auto;
  padding: 0.5rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface-container-highest);
  color: var(--mat-sys-on-surface);
  /* Il JSON resta monospaziato e scorre dentro il proprio riquadro. */
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre;
}

.devtools__changes {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.devtools__change {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
  padding: 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface-container-highest);
  color: var(--mat-sys-on-surface);
}

.devtools__change-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 0;
  margin: 0;
}

.devtools__change-label {
  font: var(--mat-sys-label-small);
  color: var(--mat-sys-on-surface-variant);
}

/* I valori JSON possono essere lunghi: vanno a capo senza causare overflow. */
.devtools__old,
.devtools__new {
  min-width: 0;
  overflow-wrap: anywhere;
}`;

// Le stesse quattro fonti alimentano entrambe le preview: nessuna copia duplicata.
const DEVTOOLS_FILES = {
  'devtools.ts': DEVTOOLS_JOURNAL,
  'devtools-inspector.ts': DEVTOOLS_INSPECTOR_TS,
  'devtools-inspector.html': DEVTOOLS_INSPECTOR_HTML,
  'devtools-inspector.css': DEVTOOLS_INSPECTOR_CSS,
};

// CONFIGURAZIONE: il file è separato dal componente e registra il reducer.
const COUNTER_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { counterReducer } from './counter.reducer';
import { devtoolsMetaReducer } from './devtools';

// provideStore crea lo Store radice della preview.
// La chiave "counter" diventa la fetta letta da createFeatureSelector.
// metaReducers collega il journal DevTools senza aggiungerlo allo stato.
export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(
      { counter: counterReducer },
      { metaReducers: [devtoolsMetaReducer] },
    ),
  ],
};
`;

// AZIONI: createActionGroup descrive gli eventi che il componente può inviare.
const COUNTER_ACTIONS = `import { createActionGroup, emptyProps } from '@ngrx/store';

// Il source identifica la feature; il tipo reale diventa "[Counter] increment".
export const CounterActions = createActionGroup({
  source: 'Counter',
  events: {
    increment: emptyProps(),
    decrement: emptyProps(),

    // Reset azzera il dominio; la cronologia DevTools è un'altra cosa.
    reset: emptyProps(),
  },
});
`;

// REDUCER: funzione pura che riceve lo stato precedente e l'azione.
const COUNTER_REDUCER = `import { createReducer, on } from '@ngrx/store';
import { CounterActions } from './counter.actions';

export interface CounterState {
  count: number;
}

// Lo stato di dominio resta minimo e puro: la cronologia vive nel DevTools.
export const initialCounterState: CounterState = {
  count: 0,
};

export const counterReducer = createReducer(
  initialCounterState,

  // Questa riga è il punto da modificare: +1 diventa il nuovo conteggio reale.
  on(CounterActions.increment, state => ({ count: state.count + 1 })),
  on(CounterActions.decrement, state => ({ count: state.count - 1 })),

  // Reset esplicito: solo il conteggio torna a zero.
  on(CounterActions.reset, () => ({ count: 0 })),
);
`;

// SELETTORI: leggono lo Store e derivano valori senza duplicare lo stato.
const COUNTER_SELECTORS = `import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CounterState } from './counter.reducer';

// La chiave deve coincidere con quella registrata in app.config.ts.
export const selectCounterState = createFeatureSelector<CounterState>('counter');

export const selectCount = createSelector(
  selectCounterState,
  state => state.count,
);

// Il doppio è derivato dal conteggio: non è un secondo campo da mantenere.
export const selectDouble = createSelector(
  selectCount,
  count => count * 2,
);
`;

// COMPONENTE: legge con selectSignal e scrive solo con dispatch.
const COUNTER_COMPONENT = `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { DevtoolsInspector } from './devtools-inspector';
import { CounterActions } from './counter.actions';
import { selectCount, selectDouble } from './counter.selectors';

@Component({
  selector: 'app-counter-store',
  imports: [MatButtonModule, DevtoolsInspector],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class CounterStoreDemo {
  private readonly store = inject(Store);

  // selectSignal espone un selettore NgRx come signal di Angular.
  // Non è un SignalStore: lo stato continua a vivere nell'unico Store.
  readonly count = this.store.selectSignal(selectCount);
  readonly double = this.store.selectSignal(selectDouble);

  increment(): void {
    // dispatch è l'unico modo per chiedere una modifica allo stato.
    this.store.dispatch(CounterActions.increment());
  }

  decrement(): void {
    this.store.dispatch(CounterActions.decrement());
  }

  reset(): void {
    // Il reducer riporta il conteggio a zero; la cronologia resta consultabile.
    this.store.dispatch(CounterActions.reset());
  }
}
`;

const COUNTER_HTML = `<div class="store-page">
  <section class="counter">
    <p class="counter__hint">
      Ogni clic invia un'<strong>azione</strong>. Il <code>reducer</code> crea il nuovo stato; i
      <code>selettori</code> aggiornano i signal letti dal template.
    </p>

    <div class="counter__flow">
      <section class="counter__panel counter__panel--actions" aria-label="Azioni">
        <h3 class="counter__title">1. Action</h3>

        <div class="counter__buttons">
          <!-- Il componente non calcola il conteggio: chiede l'azione al reducer. -->
          <button
            matButton="filled"
            type="button"
            aria-label="Decrementa di uno"
            (click)="decrement()"
          >
            Decrementa
          </button>

          <button
            matButton="filled"
            type="button"
            aria-label="Incrementa di uno"
            (click)="increment()"
          >
            Incrementa
          </button>

          <button
            matButton="outlined"
            type="button"
            aria-label="Azzera il conteggio"
            (click)="reset()"
          >
            Reset
          </button>
        </div>

        <p class="counter__empty">
          Reset: il conteggio torna a 0. La cronologia DevTools non viene svuotata.
        </p>
      </section>

      <section class="counter__panel counter__panel--state" aria-label="Valori correnti dai selettori">
        <h3 class="counter__title">2. Stato e selettori</h3>

        <div class="counter__values">
          <div class="counter__value-card">
            <span class="counter__label">Conteggio</span>
            <p class="counter__value" aria-label="Conteggio corrente">{{ count() }}</p>
          </div>

          <div class="counter__value-card">
            <span class="counter__label">Doppio derivato</span>
            <p class="counter__value" aria-label="Valore doppio">{{ double() }}</p>
          </div>
        </div>

        <p class="counter__empty">
          Il doppio arriva da <code>selectDouble</code>: nessun campo duplicato da tenere allineato.
        </p>
      </section>
    </div>
  </section>

  <!-- Stesso pannello condiviso dalla preview Todo: legge il journal del MetaReducer. -->
  <app-devtools-inspector />
</div>`;

const COUNTER_CSS = `/* I token Material mantengono il contrasto nel tema chiaro e in quello scuro. */
.store-page {
  display: grid;
  /* Demo e DevTools stanno affiancati quando c'è spazio, in colonna su mobile. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  align-items: start;
  gap: 1rem;
  min-width: 0;
}

.counter {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.counter__hint {
  margin: 0;
  overflow-wrap: anywhere;
}

.counter__flow {
  display: grid;
  /* auto-fit evita lo sbordamento su schermi stretti. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 0.75rem;
}

.counter__panel {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-medium);
}

/* Ogni pannello usa una coppia container/on-container leggibile. */
.counter__panel--actions {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.counter__panel--state {
  background: var(--mat-sys-tertiary-container);
  color: var(--mat-sys-on-tertiary-container);
}

.counter__title {
  margin: 0;
  font: var(--mat-sys-title-small);
  overflow-wrap: anywhere;
}

.counter__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.counter__values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
  gap: 0.5rem;
  margin: 0;
}

.counter__value-card {
  display: grid;
  gap: 0.125rem;
  min-width: 0;
  padding: 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

.counter__label {
  font: var(--mat-sys-label-large);
}

.counter__value {
  margin: 0;
  font: var(--mat-sys-headline-small);
  overflow-wrap: anywhere;
}

.counter__empty {
  margin: 0;
  font: var(--mat-sys-body-small);
}`;

export const COUNTER_STORE_SOURCES: PlaygroundSources = {
  typescript: COUNTER_COMPONENT,
  files: {
    'app.config.ts': COUNTER_CONFIG,
    'counter.actions.ts': COUNTER_ACTIONS,
    'counter.reducer.ts': COUNTER_REDUCER,
    'counter.selectors.ts': COUNTER_SELECTORS,
    ...DEVTOOLS_FILES,
  },
  html: COUNTER_HTML,
  css: COUNTER_CSS,
};

// CONFIGURAZIONE: ogni preview registra solo il reducer della propria feature.
const TODO_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { todoReducer } from './todo.reducer';
import { devtoolsMetaReducer } from './devtools';

// La preview del todo ha uno Store indipendente da quella del contatore.
// Il journal DevTools arriva dallo stesso metaReducer, fuori da "todos".
export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(
      { todos: todoReducer },
      { metaReducers: [devtoolsMetaReducer] },
    ),
  ],
};
`;

// AZIONI: il filtro fa parte del payload e quindi dello stato condiviso.
const TODO_ACTIONS = `import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { TodoFilter } from './todo.reducer';

// props tipizza il payload: titolo, id oppure filtro.
export const TodoActions = createActionGroup({
  source: 'Todo',
  events: {
    add: props<{ title: string }>(),
    toggle: props<{ id: number }>(),
    remove: props<{ id: number }>(),

    // Anche il filtro è un'azione: la vista non lo conserva per conto suo.
    setFilter: props<{ filter: TodoFilter }>(),
    reset: emptyProps(),
  },
});
`;

// REDUCER: trim, id deterministici e stato minimo restano qui.
const TODO_REDUCER = `import { createReducer, on } from '@ngrx/store';
import { TodoActions } from './todo.actions';

export type TodoFilter = 'all' | 'active' | 'completed';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export interface TodoState {
  todos: Todo[];
  filter: TodoFilter;
  // nextId cresce nello stato: nessun Date.now o random nel reducer.
  nextId: number;
}

// Nessuna cronologia nello stato: la registra il metaReducer DevTools.
export const initialTodoState: TodoState = {
  todos: [],
  filter: 'all',
  nextId: 1,
};

export const todoReducer = createReducer(
  initialTodoState,

  on(TodoActions.add, (state, action) => {
    // Trim e guardia: un titolo vuoto non crea attività né consuma un id.
    // Restituendo lo stesso stato, il journal mostra "Nessuna variazione".
    const title = action.title.trim();
    if (!title) return state;

    const todo: Todo = { id: state.nextId, title, completed: false };

    // Nuovo oggetto e nuovo array: nessuna mutazione dello stato precedente.
    return { ...state, todos: [...state.todos, todo], nextId: state.nextId + 1 };
  }),

  on(TodoActions.toggle, (state, action) => {
    if (!state.todos.some(todo => todo.id === action.id)) return state;

    // map crea un nuovo array e un nuovo oggetto solo per l'attività scelta.
    return {
      ...state,
      todos: state.todos.map(todo =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo),
    };
  }),

  on(TodoActions.remove, (state, action) => {
    if (!state.todos.some(todo => todo.id === action.id)) return state;

    // filter restituisce un nuovo array senza modificare quello precedente.
    return { ...state, todos: state.todos.filter(todo => todo.id !== action.id) };
  }),

  on(TodoActions.setFilter, (state, action) => ({ ...state, filter: action.filter })),

  // Reset esplicito: lista, filtro e nextId tornano allo stato iniziale.
  // La cronologia del DevTools è indipendente e resta consultabile.
  on(TodoActions.reset, () => initialTodoState),
);
`;

// SELETTORI: la lista visibile dipende dal filtro conservato nello Store.
const TODO_SELECTORS = `import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TodoState } from './todo.reducer';

// La chiave coincide con quella registrata in app.config.ts.
export const selectTodoState = createFeatureSelector<TodoState>('todos');

export const selectTodos = createSelector(
  selectTodoState,
  state => state.todos,
);

export const selectFilter = createSelector(
  selectTodoState,
  state => state.filter,
);

// Lista visibile, totali e completate sono valori derivati.
export const selectVisibleTodos = createSelector(
  selectTodos,
  selectFilter,
  (todos, filter) => filter === 'all'
    ? todos
    : todos.filter(todo => filter === 'completed' ? todo.completed : !todo.completed),
);

export const selectTotal = createSelector(
  selectTodos,
  todos => todos.length,
);

export const selectDone = createSelector(
  selectTodos,
  todos => todos.filter(todo => todo.completed).length,
);
`;

// COMPONENTE: la bozza resta locale; tutto il resto passa dallo Store.
const TODO_COMPONENT = `import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { DevtoolsInspector } from './devtools-inspector';
import { TodoActions } from './todo.actions';
import type { TodoFilter } from './todo.reducer';
import { selectDone, selectFilter, selectTotal, selectVisibleTodos } from './todo.selectors';

@Component({
  selector: 'app-todo-store',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, DevtoolsInspector],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class TodoStoreDemo {
  private readonly store = inject(Store);

  // Bozza locale: cambia a ogni tasto e non entra nello stato condiviso.
  readonly draft = signal('');

  // Tutte le letture vengono dallo Store attraverso i selettori.
  readonly todos = this.store.selectSignal(selectVisibleTodos);
  readonly filter = this.store.selectSignal(selectFilter);
  readonly total = this.store.selectSignal(selectTotal);
  readonly done = this.store.selectSignal(selectDone);

  add(): void {
    // Il testo grezzo va all'azione: trim e guardia sul vuoto stanno nel reducer.
    this.store.dispatch(TodoActions.add({ title: this.draft() }));
    this.draft.set('');
  }

  toggle(id: number): void {
    // L'id arriva dalla riga; il reducer aggiorna solo quell'attività.
    this.store.dispatch(TodoActions.toggle({ id }));
  }

  remove(id: number): void {
    this.store.dispatch(TodoActions.remove({ id }));
  }

  setFilter(filter: TodoFilter): void {
    // Il filtro è un dato condiviso, non uno stato locale della vista.
    this.store.dispatch(TodoActions.setFilter({ filter }));
  }

  reset(): void {
    // Il reducer riporta lista, filtro e nextId allo stato iniziale.
    this.store.dispatch(TodoActions.reset());
    this.draft.set('');
  }
}
`;

const TODO_HTML = `<div class="store-page">
  <section class="todo">
    <p class="todo__hint">
      Scrivi un titolo e premi <strong>Aggiungi</strong>: il <code>reducer</code> applica il
      <code>trim</code>, assegna l'id e aggiorna lo stato. I <code>selettori</code> derivano lista
      visibile e contatori.
    </p>

    <div class="todo__composer">
      <!-- La bozza del campo è locale: non viene copiata nello Store. -->
      <mat-form-field appearance="outline" class="todo__field">
        <mat-label>Nuova attività</mat-label>

        <input
          matInput
          aria-label="Titolo nuova attività"
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          (keyup.enter)="add()"
        />
      </mat-form-field>

      <div class="todo__composer-actions">
        <button
          matButton="filled"
          type="button"
          aria-label="Aggiungi attività"
          (click)="add()"
        >
          Aggiungi
        </button>

        <button
          matButton="outlined"
          type="button"
          aria-label="Azzera lista e filtro"
          (click)="reset()"
        >
          Reset
        </button>
      </div>
    </div>

    <div class="todo__flow">
      <section class="todo__panel todo__panel--filters" aria-label="Filtro">
        <h3 class="todo__title">Filtro nello Store</h3>

        <!-- Il filtro attivo usa filled; aria-pressed ne comunica lo stato alle tecnologie assistive. -->
        <div class="todo__filters">
          <button
            [matButton]="filter() === 'all' ? 'filled' : 'outlined'"
            type="button"
            aria-label="Mostra tutte le attività"
            [attr.aria-pressed]="filter() === 'all'"
            (click)="setFilter('all')"
          >
            Tutte
          </button>

          <button
            [matButton]="filter() === 'active' ? 'filled' : 'outlined'"
            type="button"
            aria-label="Mostra le attività attive"
            [attr.aria-pressed]="filter() === 'active'"
            (click)="setFilter('active')"
          >
            Attive
          </button>

          <button
            [matButton]="filter() === 'completed' ? 'filled' : 'outlined'"
            type="button"
            aria-label="Mostra le attività completate"
            [attr.aria-pressed]="filter() === 'completed'"
            (click)="setFilter('completed')"
          >
            Completate
          </button>
        </div>
      </section>

      <section class="todo__panel todo__panel--counts" aria-label="Riepilogo">
        <h3 class="todo__title">Selettori derivati</h3>

        <p class="todo__count">
          Totali
          <strong class="todo__number" aria-label="Totale attività">{{ total() }}</strong>
        </p>

        <p class="todo__count">
          Completate
          <strong class="todo__number" aria-label="Attività completate">{{ done() }}</strong>
        </p>

        <p class="todo__count">
          Visibili
          <strong class="todo__number" aria-label="Attività visibili">{{ todos().length }}</strong>
        </p>
      </section>
    </div>

    <section class="todo__panel todo__panel--list" aria-label="Attività">
      @if (todos().length === 0) {
        <p class="todo__empty">Nessuna attività in questo filtro.</p>
      } @else {
        <ul class="todo__list">
          <!-- track todo.id segue l'identità reale, non la posizione nell'array. -->
          @for (todo of todos(); track todo.id) {
            <li class="todo__item" [class.todo__item--done]="todo.completed">
              <button
                matButton="text"
                type="button"
                class="todo__toggle"
                [attr.aria-label]="(todo.completed ? 'Segna come attiva: ' : 'Segna come completata: ') + todo.title"
                [attr.aria-pressed]="todo.completed"
                (click)="toggle(todo.id)"
              >
                {{ todo.completed ? 'Fatta' : 'Da fare' }}
              </button>

              <span class="todo__text">{{ todo.title }}</span>
              <span class="todo__id">#{{ todo.id }}</span>

              <button
                matButton="text"
                type="button"
                [attr.aria-label]="'Rimuovi: ' + todo.title"
                (click)="remove(todo.id)"
              >
                Rimuovi
              </button>
            </li>
          }
        </ul>
      }
    </section>
  </section>

  <!-- Il DevTools condiviso mostra payload e snapshot delle azioni Todo reali. -->
  <app-devtools-inspector />
</div>`;

const TODO_CSS = `/* I token Material adattano superfici e testo al tema attivo. */
.store-page {
  display: grid;
  /* Demo e DevTools stanno affiancati quando c'è spazio, in colonna su mobile. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  align-items: start;
  gap: 1rem;
  min-width: 0;
}

.todo {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.todo__hint {
  margin: 0;
  overflow-wrap: anywhere;
}

.todo__composer {
  display: grid;
  gap: 0.5rem;
}

/* Il campo occupa la riga; i pulsanti vanno a capo se lo spazio finisce. */
.todo__field {
  width: 100%;
}

.todo__composer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.todo__flow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 0.75rem;
}

.todo__panel {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-medium);
}

/* Coppie container/on-container per distinguere filtro, riepilogo e lista. */
.todo__panel--filters {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.todo__panel--counts {
  background: var(--mat-sys-tertiary-container);
  color: var(--mat-sys-on-tertiary-container);
}

.todo__panel--list {
  background: var(--mat-sys-surface-container-high);
  color: var(--mat-sys-on-surface);
}

.todo__title {
  margin: 0;
  font: var(--mat-sys-title-small);
  overflow-wrap: anywhere;
}

.todo__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.todo__count {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0;
}

.todo__number {
  font: var(--mat-sys-headline-small);
}

.todo__list {
  display: grid;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* La riga si riorganizza su schermi stretti senza perdere i controlli. */
.todo__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.25rem 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

/* Il completamento non è indicato solo dal colore: cambia anche l'etichetta. */
.todo__item--done .todo__text {
  text-decoration: line-through;
  color: var(--mat-sys-on-surface-variant);
}

.todo__text {
  flex: 1 1 8rem;
  min-width: 0;
  overflow-wrap: anywhere;
}

.todo__id {
  font: var(--mat-sys-label-small);
  color: var(--mat-sys-on-surface-variant);
}

.todo__empty {
  margin: 0;
  font: var(--mat-sys-body-small);
}`;

export const TODO_STORE_SOURCES: PlaygroundSources = {
  typescript: TODO_COMPONENT,
  files: {
    'app.config.ts': TODO_CONFIG,
    'todo.actions.ts': TODO_ACTIONS,
    'todo.reducer.ts': TODO_REDUCER,
    'todo.selectors.ts': TODO_SELECTORS,
    ...DEVTOOLS_FILES,
  },
  html: TODO_HTML,
  css: TODO_CSS,
};

/** Two independent real NgRx Store projects; each preview registers and resets its own store. */
export const NGRX_EXAMPLES: readonly LessonExample[] = [
  {
    id: 'counter-store',
    label: '1. Contatore NgRx',
    title: 'Azioni, reducer e selettori reali',
    prompt:
      'Premi **Incrementa** due volte: conteggio, doppio e DevTools cambiano insieme. Seleziona un’azione nella cronologia e confronta payload, stato precedente e stato successivo. **Pulisci cronologia** non azzera il conteggio. Modifica `state.count + 1` nel reducer e riesegui: cambiano il risultato reale e i nuovi snapshot.',
    takeaway:
      'Un `MetaReducer` reale osserva lo stato restituito dal reducer radice e scrive un journal fuori dallo Store. Il componente invia `CounterActions` con `dispatch`; i selettori aggiornano la vista. La cronologia limitata a otto voci è sola ispezione: non ripristina gli stati salvati.',
    sources: COUNTER_STORE_SOURCES,
    diagram: COUNTER_STORE_DIAGRAM,
  },
  {
    id: 'todo-store',
    label: '2. Todo NgRx',
    title: 'Bozza locale, stato condiviso e filtro',
    prompt:
      'Aggiungi due attività, poi prova un titolo fatto solo di spazi: l’azione compare nel DevTools con **Nessuna variazione**. Segna un’attività come completata, cambia filtro e rimuovi una riga. Infine **Reset**: lista, filtro e bozza tornano iniziali, mentre l’azione resta ispezionabile.',
    takeaway:
      'La bozza del campo resta un signal locale; lista e filtro vivono nello Store. Il reducer applica `trim`, assegna id deterministici e resta minimo. Il `MetaReducer` cattura payload e snapshot prima/dopo fuori dallo Store; Reset non svuota la cronologia, lo fa **Pulisci cronologia**.',
    sources: TODO_STORE_SOURCES,
    diagram: TODO_STORE_DIAGRAM,
  },
];
