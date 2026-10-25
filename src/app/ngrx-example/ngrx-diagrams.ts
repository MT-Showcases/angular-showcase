import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi il codice, il comportamento dell’esempio può cambiare.';

/** Dispatch and action flow reach the reducer, the DevTools metaReducer, then selectors feed the template. */
export const COUNTER_STORE_DIAGRAM: LessonDiagramData = {
  title: 'Dal clic allo stato ispezionato',
  description: '`increment()` chiama `store.dispatch`. `counterReducer` calcola il nuovo `count`; il `MetaReducer` del DevTools registra payload e snapshot fuori dallo Store. `selectCount` e `selectDouble` aggiornano il template, mentre il pannello condiviso legge il journal.',
  groups: [
    {
      title: 'Flusso dei dati',
      steps: [
        {
          nodes: [
            { id: 'counter-dispatch', label: 'Clic e dispatch', file: 'component.ts', detail: '`increment()`, `decrement()` e `reset()`' },
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
            { id: 'counter-reducer', label: 'counterReducer', file: 'counter.reducer.ts', detail: 'nuovo `count`, stato di dominio minimo' },
          ],
          connection: { direction: 'down', label: 'il metaReducer osserva il risultato' },
        },
        {
          nodes: [
            { id: 'counter-devtools', label: 'MetaReducer DevTools', file: 'devtools.ts', detail: 'journal fuori dallo Store: payload e snapshot' },
          ],
          connection: { direction: 'down', label: '`selectSignal` legge lo stato' },
        },
        {
          nodes: [
            { id: 'counter-selectors', label: 'Selettori', file: 'counter.selectors.ts', detail: '`selectCount` e `selectDouble`' },
          ],
          connection: { direction: 'down', label: 'la vista si aggiorna' },
        },
        {
          nodes: [
            { id: 'counter-template', label: 'Pannelli e DevTools', file: 'component.html', detail: 'conteggio, doppio e inspector condiviso' },
          ],
        },
      ],
    },
    {
      title: 'Configurazione e presentazione',
      steps: [
        {
          nodes: [
            { id: 'counter-config', label: 'provideStore', file: 'app.config.ts', detail: 'registra `counter` e i `metaReducers`' },
            { id: 'counter-css', label: 'Ruoli cromatici', file: 'component.css', detail: 'primary, tertiary e layout affiancato' },
          ],
        },
        {
          nodes: [
            { id: 'counter-inspector', label: 'Inspector condiviso', file: 'devtools-inspector.ts', detail: 'legge il journal, non lo Store' },
            { id: 'counter-inspector-html', label: 'Tab Material', file: 'devtools-inspector.html', detail: 'Azione, Stato e Modifiche' },
            { id: 'counter-inspector-css', label: 'JSON contenuto', file: 'devtools-inspector.css', detail: 'scroll interno e token Material' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** A local draft dispatches; the reducer owns ids and filter, the metaReducer records the real actions. */
export const TODO_STORE_DIAGRAM: LessonDiagramData = {
  title: 'Dalla bozza alla lista ispezionata',
  description: 'La bozza del campo resta locale. `add`, `toggle`, `remove`, `setFilter` e `reset` sono azioni reali; `todoReducer` applica `trim`, assegna id deterministici e aggiorna lista e filtro. Il `MetaReducer` condiviso registra payload e snapshot prima/dopo fuori dallo Store.',
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
            { id: 'todo-reducer', label: 'todoReducer', file: 'todo.reducer.ts', detail: 'trim, `nextId` e stato minimo' },
          ],
          connection: { direction: 'down', label: 'il metaReducer cattura prima e dopo' },
        },
        {
          nodes: [
            { id: 'todo-devtools', label: 'MetaReducer DevTools', file: 'devtools.ts', detail: 'journal limitato a otto voci, fuori dallo Store' },
          ],
          connection: { direction: 'down', label: '`selectSignal` aggiorna la vista' },
        },
        {
          nodes: [
            { id: 'todo-selectors', label: 'Selettori derivati', file: 'todo.selectors.ts', detail: 'visibili, totali e completate' },
          ],
          connection: { direction: 'down', label: 'lista e contatori cambiano' },
        },
        {
          nodes: [
            { id: 'todo-template', label: 'Lista, filtri e DevTools', file: 'component.html', detail: '`track todo.id`, `aria-pressed` e inspector' },
          ],
        },
      ],
    },
    {
      title: 'Configurazione e presentazione',
      steps: [
        {
          nodes: [
            { id: 'todo-config', label: 'provideStore', file: 'app.config.ts', detail: 'registra `todos` e i `metaReducers`' },
            { id: 'todo-css', label: 'Righe flessibili', file: 'component.css', detail: 'container/on-container e layout affiancato' },
          ],
        },
        {
          nodes: [
            { id: 'todo-inspector', label: 'Inspector condiviso', file: 'devtools-inspector.ts', detail: 'stesso componente della preview contatore' },
            { id: 'todo-inspector-html', label: 'Tab Material', file: 'devtools-inspector.html', detail: 'Azione, Stato e Modifiche' },
            { id: 'todo-inspector-css', label: 'JSON contenuto', file: 'devtools-inspector.css', detail: 'scroll interno e token Material' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
