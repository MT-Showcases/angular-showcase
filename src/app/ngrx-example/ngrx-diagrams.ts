import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi il codice, il comportamento dell’esempio può cambiare.';

/** Dispatch and action flow reach the reducer, then selectors feed the template. */
export const COUNTER_STORE_DIAGRAM: LessonDiagramData = {
  title: 'Dal clic allo stato selezionato',
  description: '`increment()` chiama `store.dispatch`. `counterReducer` processa l’azione e crea un nuovo stato immutabile; `selectCount`, `selectDouble` e `selectTrace` leggono il risultato e `selectSignal` aggiorna il template.',
  groups: [
    {
      title: 'Flusso dei dati',
      steps: [
        {
          nodes: [
            { id: 'counter-dispatch', label: 'Clic e dispatch', file: 'component.ts', detail: '`increment()`, `decrement()`, `reset()` e `clearTrace()`' },
          ],
          connection: { direction: 'down', label: 'crea l’azione' },
        },
        {
          nodes: [
            { id: 'counter-actions', label: 'CounterActions', file: 'counter.actions.ts', detail: '`createActionGroup` con `emptyProps()`' },
          ],
          connection: { direction: 'down', label: 'il reducer riceve l’azione' },
        },
        {
          nodes: [
            { id: 'counter-reducer', label: 'counterReducer', file: 'counter.reducer.ts', detail: 'nuovo `count` e traccia `slice(-8)`' },
          ],
          connection: { direction: 'down', label: 'nuovo stato nello Store' },
        },
        {
          nodes: [
            { id: 'counter-selectors', label: 'Selettori', file: 'counter.selectors.ts', detail: '`selectCount`, `selectDouble`, `selectTrace`' },
          ],
          connection: { direction: 'down', label: '`selectSignal` collega i signal' },
        },
        {
          nodes: [
            { id: 'counter-template', label: 'Pannelli e traccia', file: 'component.html', detail: 'conteggio, doppio e ultime otto azioni' },
          ],
        },
      ],
    },
    {
      title: 'Configurazione e presentazione',
      steps: [
        {
          nodes: [
            { id: 'counter-config', label: 'provideStore', file: 'app.config.ts', detail: 'registra `counter: counterReducer`' },
            { id: 'counter-css', label: 'Ruoli cromatici', file: 'component.css', detail: 'primary, secondary e tertiary container' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** A local draft dispatches; the reducer owns ids, filter and bounded trace. */
export const TODO_STORE_DIAGRAM: LessonDiagramData = {
  title: 'Dalla bozza alla lista filtrata',
  description: 'La bozza del campo resta locale. `add`, `toggle`, `remove`, `setFilter` e `reset` sono azioni; `todoReducer` applica `trim`, assegna id deterministici e aggiorna lista, filtro e traccia. I selettori derivano lista visibile e contatori.',
  groups: [
    {
      title: 'Flusso dei dati',
      steps: [
        {
          nodes: [
            { id: 'todo-draft', label: 'Bozza locale', file: 'component.ts', detail: '`signal(\'\')`: non è stato condiviso' },
          ],
          connection: { direction: 'down', label: 'Aggiungi invia il testo grezzo' },
        },
        {
          nodes: [
            { id: 'todo-actions', label: 'TodoActions', file: 'todo.actions.ts', detail: '`props` per titolo, id e filtro' },
          ],
          connection: { direction: 'down', label: 'dispatch dell’azione' },
        },
        {
          nodes: [
            { id: 'todo-reducer', label: 'todoReducer', file: 'todo.reducer.ts', detail: 'trim, `nextId` e traccia `slice(-8)`' },
          ],
          connection: { direction: 'down', label: 'lista, filtro e trace aggiornati' },
        },
        {
          nodes: [
            { id: 'todo-selectors', label: 'Selettori derivati', file: 'todo.selectors.ts', detail: 'visibili, totali e completate' },
          ],
          connection: { direction: 'down', label: '`selectSignal` aggiorna la vista' },
        },
        {
          nodes: [
            { id: 'todo-template', label: 'Lista, filtri e trace', file: 'component.html', detail: '`track todo.id` e `aria-pressed`' },
          ],
        },
      ],
    },
    {
      title: 'Configurazione e presentazione',
      steps: [
        {
          nodes: [
            { id: 'todo-config', label: 'provideStore', file: 'app.config.ts', detail: 'registra `todos: todoReducer`' },
            { id: 'todo-css', label: 'Righe flessibili', file: 'component.css', detail: 'container/on-container e testo leggibile' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
