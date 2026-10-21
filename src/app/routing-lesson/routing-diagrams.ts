import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi rotte, provider o link, il comportamento dell’esempio può cambiare.';

/** Configuration is static; the runtime branch shows what Angular creates. */
export const NAVIGATION_DIAGRAM: LessonDiagramData = {
  title: 'Configurazione e runtime',
  description: '`app.config.ts` registra le rotte con `provideRouter(routes)`. A runtime il `RouterOutlet` della radice mostra una sola vista, mentre il promemoria resta nella radice.',
  groups: [
    {
      title: 'Configurazione: import e provider',
      steps: [
        {
          nodes: [
            { id: 'navigation-config', label: 'app.config.ts', file: 'app.config.ts', detail: '`provideRouter(routes)`' },
          ],
          connection: { direction: 'down', label: 'importa e registra' },
        },
        {
          nodes: [
            { id: 'navigation-routes', label: 'app.routes.ts', file: 'app.routes.ts', detail: '`/overview` e `/about`' },
          ],
        },
      ],
    },
    {
      title: 'Runtime: la radice resta montata',
      steps: [
        {
          nodes: [
            { id: 'navigation-root', label: 'Radice', file: 'component.ts', detail: 'promemoria e link' },
          ],
          connection: { direction: 'down', label: 'ospita' },
        },
        {
          nodes: [
            { id: 'navigation-outlet', label: 'RouterOutlet', file: 'component.html', detail: 'una vista figlia alla volta' },
          ],
          connection: { direction: 'down', label: 'crea' },
        },
        {
          nodes: [
            { id: 'navigation-overview', label: 'OverviewView', file: 'overview-view.component.ts', detail: 'percorso `/overview`' },
            { id: 'navigation-about', label: 'AboutView', file: 'about-view.component.ts', detail: 'percorso `/about`' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** The same detail instance receives a new input value from the URL. */
export const PARAMETERS_DIAGRAM: LessonDiagramData = {
  title: 'Dal segmento :id all’input',
  description: 'La configurazione abilita il binding degli input. A runtime `detail/:id` crea `DetailView`: quando cambia solo l’ID, Angular aggiorna `id` nella **stessa istanza**.',
  groups: [
    {
      title: 'Configurazione: import e provider',
      steps: [
        {
          nodes: [
            { id: 'parameters-config', label: 'app.config.ts', file: 'app.config.ts', detail: '`withComponentInputBinding()`' },
          ],
          connection: { direction: 'down', label: 'registra' },
        },
        {
          nodes: [
            { id: 'parameters-routes', label: 'app.routes.ts', file: 'app.routes.ts', detail: '`detail/:id`' },
          ],
        },
      ],
    },
    {
      title: 'Runtime: parametro e dati',
      steps: [
        {
          nodes: [
            { id: 'parameters-root', label: 'Radice', file: 'component.ts', detail: 'link e `router-outlet`' },
          ],
          connection: { direction: 'down', label: 'crea' },
        },
        {
          nodes: [
            { id: 'parameters-detail', label: 'DetailView', file: 'detail-view.component.ts', detail: '`input.required<string>()`' },
          ],
          connection: { direction: 'down', label: 'ID 1 → 2: stessa istanza' },
        },
        {
          nodes: [
            { id: 'parameters-local', label: 'Stesso DetailView', file: 'detail-view.component.ts', detail: 'il conteggio locale resta' },
            { id: 'parameters-missing', label: 'Dati assenti', file: 'detail-view.component.ts', detail: 'ID 999 è una rotta valida' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Route order decides whether the wildcard is reached. */
export const FALLBACK_DIAGRAM: LessonDiagramData = {
  title: 'Ordine delle rotte e recupero',
  description: 'Le rotte sono provate dall’alto verso il basso. `**` è l’ultima, quindi riceve solo gli URL che nessuna rotta precedente ha riconosciuto. La vista di fallback offre un `RouterLink` per tornare a `/home`.',
  groups: [
    {
      title: 'Configurazione: ordine delle rotte',
      steps: [
        {
          nodes: [
            { id: 'fallback-home-route', label: 'home', file: 'app.routes.ts', detail: 'rotta riconosciuta' },
            { id: 'fallback-wildcard', label: '**', file: 'app.routes.ts', detail: 'ultima rotta' },
          ],
        },
      ],
    },
    {
      title: 'Runtime: percorso sconosciuto e recupero',
      steps: [
        {
          nodes: [
            { id: 'fallback-unknown', label: 'Percorso sconosciuto', file: 'component.html', detail: 'es. `/missing-page`' },
          ],
          connection: { direction: 'down', label: 'nessuna corrispondenza' },
        },
        {
          nodes: [
            { id: 'fallback-not-found', label: 'NotFoundView', file: 'not-found-view.component.ts', detail: 'montata dal jolly' },
          ],
          connection: { direction: 'down', label: 'link di recupero' },
        },
        {
          nodes: [
            { id: 'fallback-recovery', label: 'HomeView', file: 'home-view.component.ts', detail: 'percorso `/home`' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
