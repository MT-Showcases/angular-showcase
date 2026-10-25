import type { LessonDiagramData, LessonDiagramGroup, LessonDiagramStep } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi il codice, il comportamento dell’esempio può cambiare.';

// Configuration is separate from the request/response runtime flow below.
const HTTP_SETUP: LessonDiagramGroup = {
  title: 'Configurazione HTTP',
  steps: [
    {
      nodes: [{ id: 'http-config', label: 'Configurazione del client', file: 'app.config.ts', detail: '`provideHttpClient()`' }],
      connection: { direction: 'down', label: 'configura il client usato dal servizio' },
    },
    {
      nodes: [{ id: 'http-injection', label: 'Client iniettato nel servizio', file: 'posts.service.ts', detail: '`inject(HttpClient)`' }],
    },
  ],
};

const LIST_STEPS: readonly LessonDiagramStep[] = [
  {
    nodes: [
      {
        id: 'list-action',
        label: 'Carica lista',
        file: 'component.html',
        detail: '`(click)="load()"`',
      },
    ],
    connection: { direction: 'down', label: 'chiama' },
  },
  {
    nodes: [
      {
        id: 'list-method',
        label: 'load()',
        file: 'component.ts',
        detail: '`subscribe({ next, error })`',
      },
    ],
    connection: { direction: 'down', label: 'richiede una GET all’API esterna' },
  },
  {
    nodes: [
      {
        id: 'list-service',
        label: 'PostsService',
        file: 'posts.service.ts',
        detail: '`http.get<Post[]>`',
      },
    ],
    connection: { direction: 'down', label: 'risposta o errore' },
  },
  {
    nodes: [
      {
        id: 'list-state',
        label: 'Signal della vista',
        file: 'component.ts',
        detail: '`posts`, `loading`, `error`',
      },
    ],
  },
];

/** One explicit click starts the observable; finalize closes the waiting state. */
export const LIST_DIAGRAM: LessonDiagramData = {
  title: 'Dal clic alla lista',
  description: 'Il pulsante avvia `load()`. Il componente si sottoscrive al servizio, che chiama l’**API esterna**: `next` aggiorna i signal, `error` conserva la lista precedente e `finalize` chiude l’attesa.',
  groups: [HTTP_SETUP,{ title: 'Richiesta e risposta', steps: LIST_STEPS }],
  note: INITIAL_SCHEMA_NOTE,
};

/** A validated ID clears the old detail before the new request. */
export const DETAIL_DIAGRAM: LessonDiagramData = {
  title: 'Un ID, un solo dettaglio',
  description: 'Il campo numerico valida un intero positivo prima della richiesta. All’avvio la vista svuota il dettaglio precedente; un 404 lascia quindi solo l’errore, senza dati obsoleti.',
  groups: [HTTP_SETUP,
    {
      title: 'Richiesta del dettaglio',
      steps: [
        {
          nodes: [
            {
              id: 'detail-input',
              label: 'Campo ID',
              file: 'component.html',
              detail: '`type="number"`, `[ngModel]`',
            },
          ],
          connection: { direction: 'down', label: 'abilita il pulsante' },
        },
        {
          nodes: [
            {
              id: 'detail-validate',
              label: 'validId',
              file: 'component.ts',
              detail: '`computed` su `Number.isInteger`',
            },
          ],
          connection: { direction: 'down', label: 'chiama load()' },
        },
        {
          nodes: [
            {
              id: 'detail-service',
              label: 'PostsService',
              file: 'posts.service.ts',
              detail: '`http.get<Post>`',
            },
          ],
          connection: { direction: 'down', label: 'GET all’API esterna' },
        },
        {
          nodes: [
            {
              id: 'detail-result',
              label: 'Dettaglio o errore',
              file: 'component.ts',
              detail: '`selectedPost` e `error`',
            },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Validation and draft retention live between the form and the service. */
export const POST_DIAGRAM: LessonDiagramData = {
  title: 'Dalla bozza alla risposta simulata',
  description: 'Il form abilita il POST solo con titolo e testo non vuoti. Il payload viene normalizzato con `trim()`, il servizio invia la richiesta e la vista svuota la bozza solo in `next`.',
  groups: [HTTP_SETUP,
    {
      title: 'Preparazione e invio',
      steps: [
        {
          nodes: [
            {
              id: 'post-form',
              label: 'Titolo e testo',
              file: 'component.html',
              detail: '`[ngModel]` e `(ngModelChange)`',
            },
          ],
          connection: { direction: 'down', label: 'canSubmit' },
        },
        {
          nodes: [
            {
              id: 'post-method',
              label: 'submit()',
              file: 'component.ts',
              detail: 'payload con `trim()`',
            },
          ],
          connection: { direction: 'down', label: 'POST all’API esterna (simulato)' },
        },
        {
          nodes: [
            {
              id: 'post-service',
              label: 'PostsService',
              file: 'posts.service.ts',
              detail: '`http.post<Post>`',
            },
          ],
          connection: { direction: 'down', label: 'risposta o errore' },
        },
        {
          nodes: [
            {
              id: 'post-result',
              label: 'Risposta distinta',
              file: 'component.ts',
              detail: '`operationId` e `created`',
            },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** GET provides the server view; PUT and DELETE update it only after next. */
export const WRITES_DIAGRAM: LessonDiagramData = {
  title: 'Lettura e scritture simulate',
  description: 'La GET porta la risorsa del server nella vista e nella bozza. PUT e DELETE passano dal servizio: la vista locale cambia solo dopo la conferma, mentre una nuova GET ripristina il valore del server.',
  groups: [HTTP_SETUP,
    {
      title: 'Lettura dal server',
      steps: [
        {
          nodes: [
            {
              id: 'writes-get-action',
              label: 'Carica risorsa',
              file: 'component.html',
              detail: '`(click)="load()"`',
            },
          ],
          connection: { direction: 'down', label: 'chiama' },
        },
        {
          nodes: [
            {
              id: 'writes-get-method',
              label: 'load()',
              file: 'component.ts',
              detail: '`resource` e bozza',
            },
          ],
          connection: { direction: 'down', label: 'GET all’API esterna' },
        },
        {
          nodes: [
            {
              id: 'writes-get-service',
              label: 'PostsService',
              file: 'posts.service.ts',
              detail: '`http.get<Post>`',
            },
          ],
        },
      ],
    },
    {
      title: 'Scritture simulate',
      steps: [
        {
          nodes: [
            {
              id: 'writes-action',
              label: 'PUT e DELETE',
              file: 'component.html',
              detail: 'pulsanti e conferma inline',
            },
          ],
          connection: { direction: 'down', label: 'chiama' },
        },
        {
          nodes: [
            {
              id: 'writes-method',
              label: 'save() e remove()',
              file: 'component.ts',
              detail: '`canSave`, `confirmingDelete`',
            },
          ],
          connection: { direction: 'down', label: 'PUT/DELETE all’API esterna (simulati)' },
        },
        {
          nodes: [
            {
              id: 'writes-service',
              label: 'PostsService',
              file: 'posts.service.ts',
              detail: '`http.put<Post>`, `http.delete`',
            },
          ],
          connection: { direction: 'down', label: 'solo in next' },
        },
        {
          nodes: [
            {
              id: 'writes-result',
              label: 'Vista locale',
              file: 'component.ts',
              detail: 'aggiornata dopo il successo',
            },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
