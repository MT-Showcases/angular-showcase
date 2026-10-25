import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi il codice, il comportamento dell’esempio può cambiare.';

/** A cold Observable runs its producer once per subscription, once per observer. */
export const COLD_DIAGRAM: LessonDiagramData = {
  title: 'Una sorgente, due esecuzioni indipendenti',
  description: 'Il pulsante chiama `subscribe`. Ogni sottoscrizione esegue il corpo di `numbers$`, riceve `next` per 1, 2 e 3 e infine `complete`: i valori di A e B restano separati.',
  groups: [
    {
      title: 'Dalla sottoscrizione ai valori',
      steps: [
        {
          nodes: [
            { id: 'cold-button', label: 'Iscriviti A o B', file: 'component.html', detail: '`(click)` chiama `subscribeA` o `subscribeB`' },
          ],
          connection: { direction: 'down', label: 'chiama subscribe' },
        },
        {
          nodes: [
            { id: 'cold-source', label: 'numbers$', file: 'component.ts', detail: 'corpo eseguito a ogni sottoscrizione' },
          ],
          connection: { direction: 'down', label: 'next 1, 2, 3' },
        },
        {
          nodes: [
            { id: 'cold-observer', label: 'Osservatore A o B', file: 'component.ts', detail: '`next` aggiunge, `complete` chiude' },
          ],
          connection: { direction: 'down', label: 'aggiorna solo la sua lista' },
        },
        {
          nodes: [
            { id: 'cold-view', label: 'Valori e conteggio', file: 'component.html', detail: 'liste separate e `runs()` reale' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Values flow through filter and map before subscribe sees the output. */
export const PIPELINE_DIAGRAM: LessonDiagramData = {
  title: 'Dalla sorgente ai valori emessi',
  description: '`of` emette gli ingressi; `filter` scarta i dispari, `map` moltiplica per 10. `subscribe` raccoglie solo ciò che esce dalla pipeline e il template lo mostra.',
  groups: [
    {
      title: 'Pipeline e sottoscrizione',
      steps: [
        {
          nodes: [
            { id: 'pipeline-source', label: 'of(1…6)', file: 'component.ts', detail: 'valori di ingresso' },
          ],
          connection: { direction: 'down', label: 'passa a filter' },
        },
        {
          nodes: [
            { id: 'pipeline-filter', label: 'filter(pari)', file: 'component.ts', detail: 'scarta i valori che non superano il test' },
          ],
          connection: { direction: 'down', label: 'passa i pari a map' },
        },
        {
          nodes: [
            { id: 'pipeline-map', label: 'map(×10)', file: 'component.ts', detail: 'trasforma i valori rimasti' },
          ],
          connection: { direction: 'down', label: 'emette ai sottoscrittori' },
        },
        {
          nodes: [
            { id: 'pipeline-subscribe', label: 'subscribe', file: 'component.ts', detail: 'avvia il flusso e raccoglie le uscite' },
          ],
          connection: { direction: 'down', label: 'aggiorna la preview' },
        },
        {
          nodes: [
            { id: 'pipeline-output', label: 'Valori emessi', file: 'component.html', detail: 'solo i risultati reali' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Start, finite completion and cancellation have distinct lifecycle paths. */
export const INTERVAL_DIAGRAM: LessonDiagramData = {
  title: 'Avvio, limite e pulizia',
  description: '`interval` parte con `subscribe`. `take(4)` produce un `complete` reale; `unsubscribe` annulla il timer senza chiamare `complete`. `takeUntilDestroyed` e `finalize` chiudono la sottoscrizione quando la preview viene distrutta.',
  groups: [
    {
      title: 'Emissione',
      steps: [
        {
          nodes: [
            { id: 'interval-button', label: 'Avvia intervallo', file: 'component.html', detail: '`(click)` chiama `start`' },
          ],
          connection: { direction: 'down', label: 'crea la sottoscrizione' },
        },
        {
          nodes: [
            { id: 'interval-source', label: 'interval(1000)', file: 'component.ts', detail: 'emette solo dopo l’avvio' },
          ],
          connection: { direction: 'down', label: 'conta i valori' },
        },
        {
          nodes: [
            { id: 'interval-take', label: 'take(4)', file: 'component.ts', detail: 'chiude il flusso al quarto valore' },
          ],
          connection: { direction: 'down', label: 'aggiorna la cronologia' },
        },
      ],
    },
    {
      title: 'Fine e pulizia',
      steps: [
        {
          nodes: [
            { id: 'interval-stop', label: 'Ferma o completa', file: 'component.ts', detail: '`unsubscribe` oppure `complete`' },
          ],
          connection: { direction: 'down', label: 'esegue la pulizia' },
        },
        {
          nodes: [
            { id: 'interval-finalize', label: 'finalize', file: 'component.ts', detail: 'conta la pulizia e libera la sottoscrizione' },
          ],
          connection: { direction: 'down', label: 'mostra lo stato reale' },
        },
        {
          nodes: [
            { id: 'interval-view', label: 'Stato e cronologia', file: 'component.html', detail: 'valori limitati e contatori' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
