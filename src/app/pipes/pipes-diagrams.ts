import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. La pipe trasforma la vista; il dato originale resta invariato. Se modifichi espressione o parametri, il risultato cambia.';

/** The ISO timestamp stays intact while date changes its presentation. */
export const DATE_DIAGRAM: LessonDiagramData = {
  title: 'La pipe cambia solo la presentazione',
  description: '`timestamp` resta la stringa ISO originale. `date` crea un testo formattato per la vista; formato e fuso sono parametri, non modifiche al dato.',
  groups: [
    {
      title: 'Dato originale e risultato formattato',
      steps: [
        {
          nodes: [
            { id: 'date-source', label: 'Dato originale', file: 'component.ts', detail: "`timestamp = '2026-10-16T10:30:00Z'`" },
          ],
          connection: { direction: 'down', label: 'la pipe riceve lo stesso valore' },
        },
        {
          nodes: [
            { id: 'date-pipe', label: 'Espressione con pipe', file: 'component.html', detail: "`timestamp | date:dateFormat:timezone:'en-US'`" },
          ],
          connection: { direction: 'down', label: 'restituisce il testo formattato' },
        },
        {
          nodes: [
            { id: 'date-result', label: 'Risultato nella vista', file: 'component.html', detail: '`2026-10-16` con formato e fuso iniziali' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Currency changes the label around the number but never converts it. */
export const CURRENCY_DIAGRAM: LessonDiagramData = {
  title: 'La valuta è un’etichetta, non una conversione',
  description: '`amount` è il numero; `currency` sceglie l’etichetta mostrata. La pipe `currency` non applica alcun **tasso di cambio** e non modifica il numero.',
  groups: [
    {
      title: 'Numero e valuta',
      steps: [
        {
          nodes: [
            { id: 'currency-source', label: 'Numero e parametri', file: 'component.ts', detail: "`amount = 1234.5`, `currency = 'EUR'`, `currencyDisplay = 'symbol'`" },
          ],
          connection: { direction: 'down', label: 'la pipe formatta per la vista' },
        },
        {
          nodes: [
            { id: 'currency-pipe', label: 'Espressione con pipe', file: 'component.html', detail: "`amount | currency:currency:currencyDisplay:'1.2-2':'en-US'`" },
          ],
          connection: { direction: 'down', label: 'restituisce il testo formattato' },
        },
        {
          nodes: [
            { id: 'currency-result', label: 'Risultato nella vista', file: 'component.html', detail: 'Testo con valuta e decimali; `amount` resta invariato' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Uppercase returns a new display string without touching the state. */
export const UPPERCASE_DIAGRAM: LessonDiagramData = {
  title: 'La pipe restituisce una nuova stringa',
  description: '`text` conserva la grafia digitata. `uppercase` produce una **nuova stringa** solo per il risultato mostrato.',
  groups: [
    {
      title: 'Stato e testo presentato',
      steps: [
        {
          nodes: [
            { id: 'uppercase-source', label: 'Testo originale nello stato', file: 'component.ts', detail: "`text = 'Angular si impara provando'`" },
          ],
          connection: { direction: 'down', label: 'la pipe trasforma il valore per la vista' },
        },
        {
          nodes: [
            { id: 'uppercase-pipe', label: 'Risultato in maiuscolo', file: 'component.html', detail: '`(text | uppercase)`' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** A pure pipe in its own file, fed by a new array reference. */
export const TAG_LIST_DIAGRAM: LessonDiagramData = {
  title: 'Una pipe personalizzata, in un file separato',
  description: '`TagListPipe` vive in `tag-list.pipe.ts` ed è pura: riceve `labels` e `separator` e restituisce una stringa. `addLabel` crea un **nuovo array** con lo spread, così la pipe viene ricalcolata.',
  groups: [
    {
      title: 'Valore, parametro e trasformazione',
      steps: [
        {
          nodes: [
            { id: 'tag-source', label: 'Array e parametro', file: 'component.ts', detail: '`labels` e `separator` nello stato' },
          ],
          connection: { direction: 'down', label: 'il template passa valore e parametro' },
        },
        {
          nodes: [
            { id: 'tag-expression', label: 'Espressione con pipe', file: 'component.html', detail: '`labels | tagList:separator`' },
          ],
          connection: { direction: 'down', label: 'la pipe trasforma i dati' },
        },
        {
          nodes: [
            { id: 'tag-pipe', label: 'Pipe personalizzata', file: 'tag-list.pipe.ts', detail: '`transform(labels, separator)` usa `join`' },
          ],
          connection: { direction: 'down', label: 'restituisce una stringa alla vista' },
        },
        {
          nodes: [
            { id: 'tag-result', label: 'Risultato nella vista', file: 'component.html', detail: '`template · dati` con i valori iniziali' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
