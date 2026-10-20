import type { LessonDiagramData, LessonDiagramStep } from '../components/lesson-diagram/lesson-diagram';

// The shared pair appears in both schemas: only provider placement changes.
const INHERITED_STEPS: readonly LessonDiagramStep[] = [
  {
    nodes: [
      {
        id: 'shared-parent',
        label: 'Componente padre',
        file: 'component.ts',
        detail: '`providers: [CounterService]`',
      },
    ],
    connection: { direction: 'down', label: 'fornisce' },
  },
  {
    nodes: [
      {
        id: 'shared-instance',
        label: 'Istanza condivisa',
        file: 'counter.service.ts',
        detail: 'Un solo oggetto `CounterService`',
      },
    ],
    connection: { direction: 'up', label: 'richiedono con inject()' },
  },
  {
    nodes: [
      { id: 'shared-a', label: 'Condivisa A', file: 'counter-view.component.ts', detail: '`CounterView`' },
      { id: 'shared-b', label: 'Condivisa B', file: 'counter-view.component.ts', detail: '`CounterView`' },
    ],
  },
];

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi i provider, il comportamento dell’esempio può cambiare.';

/** One parent provider: both consumers request and receive the same object. */
export const SHARED_SERVICE_DIAGRAM: LessonDiagramData = {
  title: 'Un provider, un solo oggetto',
  description: 'Le due viste chiamano `inject(CounterService)` e ricevono lo **stesso oggetto** dal provider del padre. Un incremento in A è quindi visibile in B.',
  groups: [{ title: 'Provider del padre', steps: INHERITED_STEPS }],
  note: INITIAL_SCHEMA_NOTE,
};

/** Same service class and file, but two nearer providers open distinct scopes. */
export const SCOPED_SERVICE_DIAGRAM: LessonDiagramData = {
  title: 'La stessa classe, tre oggetti',
  description: 'Le viste condivise ereditano il provider del padre. Ogni `IsolatedCounter` dichiara un **provider più vicino**, che vince per il proprio sottoalbero: la classe e il file sono gli stessi, ma gli oggetti sono **tre**.',
  groups: [
    { title: 'Condivise: provider del padre', steps: INHERITED_STEPS },
    {
      title: 'Isolata A: provider locale',
      steps: [
        {
          nodes: [
            { id: 'local-a-provider', label: 'IsolatedCounter A', file: 'isolated-counter.component.ts', detail: 'provider locale' },
          ],
          connection: { direction: 'down', label: 'fornisce nel suo scope' },
        },
        {
          nodes: [
            { id: 'local-a-instance', label: 'Istanza locale A', file: 'counter.service.ts', detail: 'Oggetto distinto' },
          ],
          connection: { direction: 'up', label: 'richiede con inject()' },
        },
        {
          nodes: [
            { id: 'local-a-consumer', label: 'Isolata A', file: 'counter-view.component.ts', detail: '`CounterView`' },
          ],
        },
      ],
    },
    {
      title: 'Isolata B: provider locale',
      steps: [
        {
          nodes: [
            { id: 'local-b-provider', label: 'IsolatedCounter B', file: 'isolated-counter.component.ts', detail: 'provider locale' },
          ],
          connection: { direction: 'down', label: 'fornisce nel suo scope' },
        },
        {
          nodes: [
            { id: 'local-b-instance', label: 'Istanza locale B', file: 'counter.service.ts', detail: 'Oggetto distinto' },
          ],
          connection: { direction: 'up', label: 'richiede con inject()' },
        },
        {
          nodes: [
            { id: 'local-b-consumer', label: 'Isolata B', file: 'counter-view.component.ts', detail: '`CounterView`' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
