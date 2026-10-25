/**
 * Category hub metadata for /basics, /advanced, /state and /examples.
 *
 * Basics and advanced resources are derived from TOPICS: their array order is
 * the suggested sequence, while `prerequisites` are concept requirements and
 * never block a route. State lessons share TOPICS as well; standalone examples remain resource entries.
 */
import { LessonId, LessonTopic, TOPICS } from './topics';

export const CATEGORY_IDS = ['basics', 'advanced', 'state', 'examples'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type BasicsPhase = 'first-steps' | 'interfaces' | 'structure';

export type PhaseFilter = BasicsPhase | 'all';

export interface CategoryPhase {
  id: BasicsPhase;
  label: string;
  description: string;
}

export interface CategoryResource {
  id: string;
  title: string;
  route: string;
  /** Icon used by the hub card. */
  icon: string;
  /** Existing navigation icon, preserved when the navbar derives its groups. */
  navIcon: string;
  /** Short card label when the resource is not grouped in a phase. */
  kind: string;
  outcome: string;
  /** Concept prerequisites shown as study context, never as route guards. */
  prerequisites: string[];
  /** Basics only: progressive phase used by the single-select filter. */
  phase?: BasicsPhase;
  /** Orientation hint used mainly by the two-resource categories. */
  bestFor?: string;
}

export interface CategoryLink {
  label: string;
  route: string;
}

export interface CategorySection {
  id: CategoryId;
  /** H1 kept stable for basics and advanced by product compatibility. */
  title: string;
  subtitle: string;
  navLabel: string;
  navIcon: string;
  overviewLabel: string;
  overviewIcon: string;
  eyebrow: string;
  overviewTitle: string;
  intro: string;
  resourceNoun: { singular: string; plural: string };
  catalogTitle: string;
  catalogHint: string;
  phases: CategoryPhase[];
  resources: CategoryResource[];
  /** First resource in the suggested sequence, used by the starting CTA. */
  entry: CategoryResource;
  related: CategoryLink;
}

// Presentation metadata is keyed by LessonId so no lesson can be missed.
const LESSON_ICONS: Record<LessonId, string> = {
  start: 'rocket',
  binding: 'input',
  'control-flow': 'schema',
  components: 'widgets',
  pipes: 'transform',
  forms: 'assignment',
  services: 'build',
  routing: 'route',
  signals: 'sensors',
  http: 'http',
  rxjs: 'timeline',
  'behavior-subject': 'bolt',
  ngrx: 'hub',
};

const LESSON_KINDS: Record<LessonId, string> = {
  start: 'Primo componente',
  binding: 'Binding',
  'control-flow': 'Controllo del flusso',
  components: 'Componenti',
  pipes: 'Trasformazione',
  forms: 'Form reattivi',
  services: 'Servizi',
  routing: 'Navigazione',
  signals: 'Stato reattivo',
  http: 'Dati asincroni',
  rxjs: 'Flussi e operatori',
  'behavior-subject': 'Valore condiviso',
  ngrx: 'Azioni e selettori',
};

const BASICS_PHASE_BY_ID: Partial<Record<LessonId, BasicsPhase>> = {
  start: 'first-steps',
  binding: 'first-steps',
  'control-flow': 'first-steps',
  components: 'interfaces',
  pipes: 'interfaces',
  forms: 'interfaces',
  services: 'structure',
  routing: 'structure',
};

const ADVANCED_BEST_FOR: Partial<Record<LessonId, string>> = {
  signals: 'Stato sincrono e valori derivati senza sottoscrizioni manuali.',
  http: 'Richieste remote con attesa, successo ed errore.',
};

const TOPIC_TITLES = new Map<LessonId, string>(TOPICS.map((topic) => [topic.id, topic.title]));

function publishedTopics(category: LessonTopic['category']): LessonTopic[] {
  return TOPICS.filter((topic) => topic.category === category && topic.published);
}

function lessonResource(
  topic: LessonTopic,
  navIcon: string,
  phase?: BasicsPhase,
): CategoryResource {
  return {
    id: topic.id,
    title: topic.title,
    route: topic.route,
    icon: LESSON_ICONS[topic.id],
    navIcon,
    kind: LESSON_KINDS[topic.id],
    outcome: topic.outcome,
    prerequisites: topic.prerequisites.map((id) => TOPIC_TITLES.get(id) ?? id),
    phase,
    bestFor: topic.category === 'advanced' ? ADVANCED_BEST_FOR[topic.id] : undefined,
  };
}

const BASICS_RESOURCES = publishedTopics('basics').map((topic) =>
  lessonResource(topic, 'widgets', BASICS_PHASE_BY_ID[topic.id]),
);

const ADVANCED_RESOURCES = publishedTopics('advanced').map((topic) =>
  lessonResource(topic, topic.id === 'http' ? 'language' : 'bolt'),
);

const STATE_RESOURCES = publishedTopics('state').map((topic) =>
  lessonResource(topic, LESSON_ICONS[topic.id]),
);

const EXAMPLE_RESOURCES: CategoryResource[] = [
  {
    id: 'users',
    title: 'Lista utenti',
    route: '/examples/users',
    icon: 'people',
    navIcon: 'people',
    kind: 'Flusso HTTP',
    outcome:
      'Carica gli utenti da JSONPlaceholder, filtra per nome o email e rimuovi dalla vista locale, senza modificare il server.',
    prerequisites: [],
    bestFor: 'Un flusso HTTP completo con ricerca, eliminazione locale e stato vuoto.',
  },
  {
    id: 'design-system',
    title: 'Design system',
    route: '/design-system',
    icon: 'palette',
    navIcon: 'palette',
    kind: 'Catalogo UI',
    outcome:
      'Consulta token, tipografia, spaziature e controlli Material con esempi di codice pronti da riusare.',
    prerequisites: [],
    bestFor: 'Token e controlli Material da riusare mentre costruisci una pagina.',
  },
];

function section(config: Omit<CategorySection, 'entry'>): CategorySection {
  const entry = config.resources[0];
  if (!entry) {
    throw new Error(`Category ${config.id} requires at least one resource.`);
  }
  return { ...config, entry };
}

export const CATEGORY_SECTIONS: Record<CategoryId, CategorySection> = {
  basics: section({
    id: 'basics',
    title: 'Le basi di Angular',
    subtitle: 'Un percorso guidato, con la libertà di scegliere da dove iniziare.',
    navLabel: 'Basi',
    navIcon: 'school',
    overviewLabel: 'Percorso Basi',
    overviewIcon: 'home',
    eyebrow: 'Percorso Basi',
    overviewTitle: 'Costruisci le fondamenta',
    intro: 'Parti da **template e binding**, poi passa a componenti, form, servizi e routing. Scegli una fase oppure segui l’ordine delle lezioni.',
    resourceNoun: { singular: 'lezione', plural: 'lezioni' },
    catalogTitle: 'Lezioni per fase',
    catalogHint: 'Filtra per fase o mostra tutte le lezioni disponibili.',
    phases: [
      {
        id: 'first-steps',
        label: 'Prime mosse',
        description: 'Template, binding ed eventi: le basi per far reagire la vista.',
      },
      {
        id: 'interfaces',
        label: 'Interfacce e dati',
        description: 'Componenti, pipes e form: come comporre viste e gestire l’input.',
      },
      {
        id: 'structure',
        label: 'Struttura',
        description: 'Servizi e routing: condividi comportamento e collega le viste.',
      },
    ],
    resources: BASICS_RESOURCES,
    related: { label: 'Esplora Avanzato', route: '/advanced' },
  }),
  advanced: section({
    id: 'advanced',
    title: 'Approfondisci Angular',
    subtitle: 'Un percorso guidato, con la libertà di scegliere da dove iniziare.',
    navLabel: 'Avanzato',
    navIcon: 'insights',
    overviewLabel: 'Percorso Avanzato',
    overviewIcon: 'insights',
    eyebrow: 'Percorso Avanzato',
    overviewTitle: 'Dallo stato ai dati remoti',
    intro: 'Scegli cosa vuoi approfondire: **Signals** per lo stato reattivo, **HTTP** per richieste, attesa ed errori.',
    
    resourceNoun: { singular: 'lezione', plural: 'lezioni' },
    catalogTitle: 'Le due lezioni',
    catalogHint: 'Confronta il tipo di problema che risolve ciascuna lezione.',
    phases: [],
    resources: ADVANCED_RESOURCES,
    related: { label: 'Rivedi le Basi', route: '/basics' },
  }),
  state: section({
    id: 'state',
    title: 'Stato condiviso',
    subtitle: 'Dai flussi RxJS al valore condiviso, fino allo store NgRx.',
    navLabel: 'Stato',
    navIcon: 'layers',
    overviewLabel: 'Panoramica Stato',
    overviewIcon: 'dashboard',
    eyebrow: 'Stato e reattività',
    overviewTitle: 'Dai flussi allo stato condiviso',
    intro: 'Parti dai flussi **RxJS**, condividi un valore con **BehaviorSubject**, poi segui azioni e selettori di **NgRx Store**.',
    
    resourceNoun: { singular: 'lezione', plural: 'lezioni' },
    catalogTitle: 'Il percorso sullo stato',
    catalogHint: 'Segui l’ordine consigliato o scegli il concetto da approfondire.',
    phases: [],
    resources: STATE_RESOURCES,
    related: { label: 'Vai ad Avanzato', route: '/advanced' },
  }),
  examples: section({
    id: 'examples',
    title: 'Esempi e riferimenti',
    subtitle: 'Una lista utenti con dati remoti e il catalogo dei componenti condivisi.',
    navLabel: 'Esempi',
    navIcon: 'people',
    overviewLabel: 'Panoramica Esempi',
    overviewIcon: 'category',
    eyebrow: 'Esempi pratici',
    overviewTitle: 'Impara da casi concreti',
    intro: 'Esplora la **lista utenti** per vedere HTTP e ricerca in una pagina, oppure consulta il **design system** per i componenti del sito.',
    
    resourceNoun: { singular: 'esempio', plural: 'esempi' },
    catalogTitle: 'Le due risorse',
    catalogHint: 'Scegli il caso pratico o il riferimento che ti serve adesso.',
    phases: [],
    resources: EXAMPLE_RESOURCES,
    related: { label: 'Scopri lo Stato', route: '/state' },
  }),
};

export const CATEGORY_LIST: CategorySection[] = CATEGORY_IDS.map((id) => CATEGORY_SECTIONS[id]);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}
