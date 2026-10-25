import type { LessonExample } from '../components/lesson-examples/lesson-examples';
import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { COUNTER_STORE_DIAGRAM, TODO_STORE_DIAGRAM } from './ngrx-diagrams';

// CONFIGURAZIONE: il file è separato dal componente e registra il reducer.
const COUNTER_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { counterReducer } from './counter.reducer';

// provideStore crea lo Store radice della preview.
// La chiave "counter" diventa la fetta letta da createFeatureSelector.
export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({ counter: counterReducer }),
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

    // Reset e pulizia della traccia sono due richieste diverse.
    reset: emptyProps(),
    clearTrace: emptyProps(),
  },
});
`;

// REDUCER: funzione pura che riceve lo stato precedente e l'azione.
const COUNTER_REDUCER = `import { createReducer, on } from '@ngrx/store';
import { CounterActions } from './counter.actions';

// La traccia resta breve: il reducer conserva solo le ultime otto azioni.
export const MAX_TRACE = 8;

export interface CounterTraceEntry {
  id: number;
  type: string;
  count: number;
}

export interface CounterState {
  count: number;
  // sequence rende stabile la chiave di ogni voce della traccia.
  sequence: number;
  trace: CounterTraceEntry[];
}

// Lo stato iniziale è un valore di partenza, mai modificato in place.
export const initialCounterState: CounterState = {
  count: 0,
  sequence: 1,
  trace: [],
};

function record(state: CounterState, type: string, count: number): CounterState {
  // Nuovo oggetto e nuovo array: nessuna mutazione dello stato precedente.
  return {
    count,
    sequence: state.sequence + 1,
    trace: [...state.trace, { id: state.sequence, type, count }].slice(-MAX_TRACE),
  };
}

export const counterReducer = createReducer(
  initialCounterState,

  // Questa riga è il punto da modificare: +1 diventa il nuovo conteggio reale.
  on(CounterActions.increment, (state, action) => record(state, action.type, state.count + 1)),
  on(CounterActions.decrement, (state, action) => record(state, action.type, state.count - 1)),

  on(CounterActions.reset, state => ({
    // Reset esplicito: conteggio a zero e traccia svuotata.
    count: 0,
    sequence: state.sequence + 1,
    trace: [],
  })),

  on(CounterActions.clearTrace, state => ({
    // Cambia solo la cronologia: il conteggio resta com'è.
    ...state,
    trace: [],
  })),
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

export const selectTrace = createSelector(
  selectCounterState,
  state => state.trace,
);
`;

// COMPONENTE: legge con selectSignal e scrive solo con dispatch.
const COUNTER_COMPONENT = `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { CounterActions } from './counter.actions';
import { selectCount, selectDouble, selectTrace } from './counter.selectors';

@Component({
  selector: 'app-counter-store',
  imports: [MatButtonModule],
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
  readonly trace = this.store.selectSignal(selectTrace);

  increment(): void {
    // dispatch è l'unico modo per chiedere una modifica allo stato.
    this.store.dispatch(CounterActions.increment());
  }

  decrement(): void {
    this.store.dispatch(CounterActions.decrement());
  }

  reset(): void {
    // Il significato del reset è nel reducer, non nel componente.
    this.store.dispatch(CounterActions.reset());
  }

  clearTrace(): void {
    // Azione separata: non altera il conteggio.
    this.store.dispatch(CounterActions.clearTrace());
  }
}
`;

const COUNTER_HTML = `<section class="counter">
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
          aria-label="Azzera conteggio e traccia"
          (click)="reset()"
        >
          Reset
        </button>
      </div>

      <p class="counter__empty">Reset: conteggio a 0 e traccia svuotata, non solo un nuovo valore.</p>
    </section>

    <section class="counter__panel counter__panel--state" aria-label="Stato selezionato">
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

  <section class="counter__panel counter__panel--trace" aria-label="Ultime azioni">
    <header class="counter__trace-header">
      <h3 class="counter__title">3. Trace: ultime 8</h3>

      <button
        matButton="text"
        type="button"
        aria-label="Svuota la traccia"
        (click)="clearTrace()"
      >
        Svuota traccia
      </button>
    </header>

    @if (trace().length === 0) {
      <p class="counter__empty">Nessuna azione registrata: la traccia è vuota.</p>
    } @else {
      <!-- Le voci sono create dal reducer, non da un contatore nel componente. -->
      <ol class="counter__trace">
        @for (entry of trace(); track entry.id) {
          <li class="counter__entry">
            <span class="counter__type">{{ entry.type }}</span>
            <span class="counter__result">count {{ entry.count }}</span>
          </li>
        }
      </ol>
    }
  </section>
</section>`;

const COUNTER_CSS = `/* I token Material mantengono il contrasto nel tema chiaro e in quello scuro. */
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

.counter__panel--trace {
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
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

.counter__trace-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

/* La traccia va a capo invece di comprimere le etichette delle azioni. */
.counter__trace {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.counter__entry {
  display: inline-flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  padding: 0.25rem 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

.counter__type {
  font: var(--mat-sys-label-small);
  overflow-wrap: anywhere;
}

.counter__result {
  font: var(--mat-sys-body-small);
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
  },
  html: COUNTER_HTML,
  css: COUNTER_CSS,
};

// CONFIGURAZIONE: ogni preview registra solo il reducer della propria feature.
const TODO_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { todoReducer } from './todo.reducer';

// La preview del todo ha uno Store indipendente da quella del contatore.
// "todos" contiene lista, filtro, contatori e traccia delle azioni.
export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({ todos: todoReducer }),
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

// REDUCER: trim, id deterministici e traccia limitata restano qui.
const TODO_REDUCER = `import { createReducer, on } from '@ngrx/store';
import { TodoActions } from './todo.actions';

export type TodoFilter = 'all' | 'active' | 'completed';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export interface TodoTraceEntry {
  id: number;
  type: string;
  detail: string;
}

export interface TodoState {
  todos: Todo[];
  filter: TodoFilter;
  // nextId cresce nello stato: nessun Date.now o random nel reducer.
  nextId: number;
  sequence: number;
  trace: TodoTraceEntry[];
}

export const MAX_TRACE = 8;

export const initialTodoState: TodoState = {
  todos: [],
  filter: 'all',
  nextId: 1,
  sequence: 1,
  trace: [],
};

function record(state: TodoState, type: string, detail: string): TodoState {
  // spread + nuovo array: la traccia non modifica quella precedente.
  return {
    ...state,
    sequence: state.sequence + 1,
    trace: [...state.trace, { id: state.sequence, type, detail }].slice(-MAX_TRACE),
  };
}

export const todoReducer = createReducer(
  initialTodoState,

  on(TodoActions.add, (state, action) => {
    // Trim e guardia: un titolo vuoto non crea attività né consuma un id.
    const title = action.title.trim();
    if (!title) return state;

    const todo: Todo = { id: state.nextId, title, completed: false };

    return record(
      { ...state, todos: [...state.todos, todo], nextId: state.nextId + 1 },
      action.type,
      '#' + todo.id + ' «' + title + '»',
    );
  }),

  on(TodoActions.toggle, (state, action) => {
    const target = state.todos.find(todo => todo.id === action.id);
    if (!target) return state;

    // map crea un nuovo array e un nuovo oggetto solo per l'attività scelta.
    return record(
      {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.id ? { ...todo, completed: !todo.completed } : todo),
      },
      action.type,
      '#' + action.id + (target.completed ? ' attiva' : ' completata'),
    );
  }),

  on(TodoActions.remove, (state, action) => {
    if (!state.todos.some(todo => todo.id === action.id)) return state;

    // filter restituisce un nuovo array senza modificare quello precedente.
    return record(
      { ...state, todos: state.todos.filter(todo => todo.id !== action.id) },
      action.type,
      '#' + action.id,
    );
  }),

  on(TodoActions.setFilter, (state, action) => record(
    { ...state, filter: action.filter },
    action.type,
    action.filter,
  )),

  on(TodoActions.reset, state => ({
    // Reset esplicito: lista, filtro, nextId e traccia tornano allo stato iniziale.
    ...initialTodoState,
    sequence: state.sequence + 1,
  })),
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

export const selectTrace = createSelector(
  selectTodoState,
  state => state.trace,
);
`;

// COMPONENTE: la bozza resta locale; tutto il resto passa dallo Store.
const TODO_COMPONENT = `import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { TodoActions } from './todo.actions';
import type { TodoFilter } from './todo.reducer';
import { selectDone, selectFilter, selectTotal, selectTrace, selectVisibleTodos } from './todo.selectors';

@Component({
  selector: 'app-todo-store',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule],
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
  readonly trace = this.store.selectSignal(selectTrace);

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
    // Il reducer riporta lista, filtro e traccia allo stato iniziale.
    this.store.dispatch(TodoActions.reset());
    this.draft.set('');
  }
}
`;

const TODO_HTML = `<section class="todo">
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

  <section class="todo__panel todo__panel--trace" aria-label="Ultime azioni">
    <h3 class="todo__title">Trace: ultime 8</h3>

    @if (trace().length === 0) {
      <p class="todo__empty">Nessuna azione registrata: la traccia è vuota.</p>
    } @else {
      <!-- Ogni voce nasce dal reducer che ha processato l'azione reale. -->
      <ol class="todo__trace">
        @for (entry of trace(); track entry.id) {
          <li class="todo__entry">
            <span class="todo__type">{{ entry.type }}</span>
            <span class="todo__detail">{{ entry.detail }}</span>
          </li>
        }
      </ol>
    }
  </section>
</section>`;

const TODO_CSS = `/* I token Material adattano superfici e testo al tema attivo. */
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

.todo__panel--trace {
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
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

.todo__trace {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.todo__entry {
  display: inline-flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  padding: 0.25rem 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

.todo__type {
  font: var(--mat-sys-label-small);
  overflow-wrap: anywhere;
}

.todo__detail {
  font: var(--mat-sys-body-small);
  overflow-wrap: anywhere;
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
      'Premi **Incrementa** due volte: conteggio, doppio e traccia cambiano insieme. Prova **Decrementa**, poi **Svuota traccia** senza toccare il conteggio. Modifica `state.count + 1` nel reducer e riesegui: il risultato reale cambia.',
    takeaway:
      'Il componente invia `CounterActions` con `dispatch`; `counterReducer` crea un nuovo stato immutabile e registra l’azione nella traccia limitata a otto voci. `selectSignal` collega i selettori ai signal della vista.',
    sources: COUNTER_STORE_SOURCES,
    diagram: COUNTER_STORE_DIAGRAM,
  },
  {
    id: 'todo-store',
    label: '2. Todo NgRx',
    title: 'Bozza locale, stato condiviso e filtro',
    prompt:
      'Aggiungi due attività, poi prova un titolo fatto solo di spazi. Segna una attività come completata e cambia filtro: la lista visibile e i contatori derivano dallo Store. Rimuovi una riga e infine **Reset**.',
    takeaway:
      'La bozza del campo resta un signal locale; lista e filtro vivono nello Store. Il reducer applica `trim`, assegna id deterministici con `nextId` e conserva le ultime otto azioni. I selettori derivano lista visibile e contatori.',
    sources: TODO_STORE_SOURCES,
    diagram: TODO_STORE_DIAGRAM,
  },
];
