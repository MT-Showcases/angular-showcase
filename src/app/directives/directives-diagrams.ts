import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi stato, condizioni o classi, il comportamento dell’esempio cambia.';

/** Boolean state and the two exclusive branches of @if. */
export const IF_DIAGRAM: LessonDiagramData = {
  title: '@if sceglie un ramo booleano',
  description: '`visible` è un booleano in `component.ts`. Il template crea **un solo ramo** nel DOM: il primo quando è `true`, l’altro con `@else`.',
  groups: [
    {
      title: 'Un booleano, due rami',
      steps: [
        {
          nodes: [
            { id: 'if-state', label: 'Stato booleano', file: 'component.ts', detail: '`visible = true`' },
          ],
          connection: { direction: 'down', label: 'Angular valuta la condizione' },
        },
        {
          nodes: [
            { id: 'if-true', label: '@if: ramo vero', file: 'component.html', detail: '`@if (visible)` mostra il saluto' },
            { id: 'if-false', label: '@else: ramo falso', file: 'component.html', detail: '`@else` mostra l’alternativa' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Array state, identity through track and the empty fallback. */
export const FOR_DIAGRAM: LessonDiagramData = {
  title: '@for ripete gli elementi con track',
  description: '`items` contiene oggetti con `id` e `name`. `track item.id` lega ogni nodo al dato; `@empty` appare quando l’array non contiene elementi.',
  groups: [
    {
      title: 'Elenco, identità e caso vuoto',
      steps: [
        {
          nodes: [
            { id: 'for-items', label: 'Elenco nello stato', file: 'component.ts', detail: '`items = this.initialItems()`' },
          ],
          connection: { direction: 'down', label: 'il template ripete l’elenco' },
        },
        {
          nodes: [
            { id: 'for-track', label: '@for con track', file: 'component.html', detail: '`@for (item of items; track item.id)`' },
            { id: 'for-empty', label: '@empty', file: 'component.html', detail: '`@empty` quando `items` è vuoto' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** The actual cases and the default branch of @switch. */
export const SWITCH_DIAGRAM: LessonDiagramData = {
  title: '@switch mostra un caso alla volta',
  description: '`state` parte da `\'draft\'`. Il template confronta il valore con i casi e usa `@default` per un valore non previsto.',
  groups: [
    {
      title: 'Un valore, un solo caso',
      steps: [
        {
          nodes: [
            { id: 'switch-state', label: 'Valore iniziale', file: 'component.ts', detail: "`state = 'draft'`" },
          ],
          connection: { direction: 'down', label: 'il template sceglie il caso' },
        },
        {
          nodes: [
            { id: 'switch-draft', label: "@case ('draft')", file: 'component.html', detail: 'Bozza: puoi scrivere.' },
            { id: 'switch-review', label: "@case ('review')", file: 'component.html', detail: 'In revisione: controlla il testo.' },
            { id: 'switch-published', label: "@case ('published')", file: 'component.html', detail: 'Pubblicato: il testo è visibile.' },
            { id: 'switch-default', label: '@default', file: 'component.html', detail: 'Stato sconosciuto.' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Attribute directive behavior kept apart from the CSS that styles its class. */
export const DIRECTIVE_DIAGRAM: LessonDiagramData = {
  title: 'La direttiva aggiunge comportamento',
  description: '`appHighlight` è una **direttiva di attributo**: vive in `highlight.directive.ts` e modifica il pulsante esistente. Il CSS riceve la classe `highlighted`, ma non decide quando applicarla.',
  groups: [
    {
      title: 'Dal template al comportamento, poi all’aspetto',
      steps: [
        {
          nodes: [
            { id: 'directive-import', label: 'Import nel componente', file: 'component.ts', detail: '`imports: [Highlight]` abilita il selettore' },
          ],
          connection: { direction: 'down', label: 'il template usa il selettore' },
        },
        {
          nodes: [
            { id: 'directive-attribute', label: 'Attributo nel template', file: 'component.html', detail: '`appHighlight` sul pulsante esistente' },
          ],
          connection: { direction: 'down', label: 'la direttiva possiede lo stato' },
        },
        {
          nodes: [
            { id: 'directive-behavior', label: 'Comportamento della direttiva', file: 'highlight.directive.ts', detail: '`host` gestisce clic, `[class.highlighted]` e `aria-pressed`' },
          ],
          connection: { direction: 'down', label: 'la classe arriva al CSS' },
        },
        {
          nodes: [
            { id: 'directive-style', label: 'Solo aspetto', file: 'component.css', detail: '`.highlighted` disegna il contorno' },
          ],
        },
      ],
    },
  ],
  note: 'Schema della configurazione iniziale. La direttiva decide **quando** aggiungere `highlighted`; il CSS decide **come** appare. Nessuna regola CSS attiva il comportamento.',
};
