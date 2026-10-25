import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi il codice, il comportamento dell’esempio può cambiare.';

/** A click writes the writable signal; the template reads it back. */
export const COUNTER_DIAGRAM: LessonDiagramData = {
  title: 'Dall’azione al template',
  description: 'Il pulsante chiama `update` o `set`. Il signal conserva il nuovo valore e il template che legge `count()` viene aggiornato.',
  groups: [
    {
      title: 'Ciclo di aggiornamento',
      steps: [
        {
          nodes: [
            { id: 'counter-action', label: 'Pulsanti', file: 'component.html', detail: '`(click)` su Aumenta e Azzera' },
          ],
          connection: { direction: 'down', label: 'chiama' },
        },
        {
          nodes: [
            { id: 'counter-signal', label: 'count', file: 'component.ts', detail: '`signal(0)`' },
          ],
          connection: { direction: 'down', label: 'notifica la lettura' },
        },
        {
          nodes: [
            { id: 'counter-template', label: 'Template', file: 'component.html', detail: '`{{ count() }}`' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** The derived value reads the counter signal and is never stored twice. */
export const COMPUTED_DIAGRAM: LessonDiagramData = {
  title: 'Una fonte, un valore derivato',
  description: '`count` è l’unico stato modificabile. `double` legge `count()` e viene ricalcolato alla prima lettura dopo il cambio della dipendenza: non esiste un secondo signal da allineare.',
  groups: [
    {
      title: 'Dipendenza e calcolo',
      steps: [
        {
          nodes: [
            { id: 'computed-source', label: 'count', file: 'component.ts', detail: 'signal modificabile' },
          ],
          connection: { direction: 'down', label: 'viene letto da' },
        },
        {
          nodes: [
            { id: 'computed-derived', label: 'double', file: 'component.ts', detail: '`computed(() => count() * 2)`' },
          ],
          connection: { direction: 'down', label: 'fornisce il valore' },
        },
        {
          nodes: [
            { id: 'computed-template', label: 'Template', file: 'component.html', detail: '`count()` e `double()`' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** The effect watches its dependencies, writes an imperative API and cleans up. */
export const EFFECT_DIAGRAM: LessonDiagramData = {
  title: 'Dipendenza, API imperativa e pulizia',
  description: 'L’effetto legge sempre `titleSync`. Solo quando è vero legge anche `count` e scrive `DOCUMENT.title`; `onCleanup` ripristina il titolo alla riesecuzione o alla distruzione.',
  groups: [
    {
      title: 'Attivazione e scrittura',
      steps: [
        {
          nodes: [
            { id: 'effect-signals', label: 'titleSync e count', file: 'component.ts', detail: 'dipendenze lette nell’effetto' },
          ],
          connection: { direction: 'down', label: 'esegue' },
        },
        {
          nodes: [
            { id: 'effect-effect', label: 'effect', file: 'component.ts', detail: 'sincronizza il titolo' },
          ],
          connection: { direction: 'down', label: 'scrive' },
        },
        {
          nodes: [
            { id: 'effect-title', label: 'DOCUMENT.title', file: 'component.ts', detail: 'API imperativa della sola anteprima' },
          ],
        },
      ],
    },
    {
      title: 'Pulizia',
      steps: [
        {
          nodes: [
            { id: 'effect-cleanup', label: 'onCleanup', file: 'component.ts', detail: 'eseguito prima della riesecuzione e alla distruzione' },
          ],
          connection: { direction: 'down', label: 'ripristina' },
        },
        {
          nodes: [
            { id: 'effect-original', label: 'Titolo iniziale', file: 'component.ts', detail: '`originalTitle`' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Every cart change replaces the array and one object; the total stays derived. */
export const CART_DIAGRAM: LessonDiagramData = {
  title: 'Modifiche immutabili e totale derivato',
  description: 'La quantità cambia con un nuovo array e un nuovo oggetto; `track item.id` mantiene l’identità. Il totale non viene copiato: è un `computed` che legge `items()`.',
  groups: [
    {
      title: 'Dalla riga al totale',
      steps: [
        {
          nodes: [
            { id: 'cart-actions', label: 'Riga e pulsanti', file: 'component.html', detail: '`item.id` stabile' },
          ],
          connection: { direction: 'down', label: 'chiama' },
        },
        {
          nodes: [
            { id: 'cart-update', label: 'items', file: 'component.ts', detail: '`update` con nuovo array e nuovo oggetto' },
          ],
          connection: { direction: 'down', label: 'alimenta' },
        },
        {
          nodes: [
            { id: 'cart-total', label: 'total', file: 'component.ts', detail: '`computed` su prezzo e quantità' },
          ],
          connection: { direction: 'down', label: 'mostra' },
        },
        {
          nodes: [
            { id: 'cart-template', label: 'Template', file: 'component.html', detail: '`@for` con `track item.id` e stato vuoto' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
