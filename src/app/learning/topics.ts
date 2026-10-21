/** Learning navigation metadata. Only published lessons are exposed as links. */
export type LessonId = 'start' | 'binding' | 'control-flow' | 'components' | 'pipes' | 'course-exercise' | 'forms' | 'services' | 'routing' | 'signals' | 'http';
export interface LessonTopic {
  id: LessonId;
  category: 'basics' | 'advanced';
  title: string;
  route: string;
  outcome: string;
  prerequisites: LessonId[];
  published: boolean;
}
export const TOPICS: LessonTopic[] = [
  { id: 'start', category: 'basics', title: 'Il primo componente', route: '/basics/getting-started', outcome: 'Riconosci classe, template e stili e modifica la tua prima vista.', prerequisites: [], published: true },
  { id: 'binding', category: 'basics', title: 'Data Binding', route: '/basics/data-binding', outcome: 'Collega valori, proprietà ed eventi e sperimenta il binding bidirezionale.', prerequisites: ['start'], published: true },
  { id: 'control-flow', category: 'basics', title: 'Control flow e direttive', route: '/basics/directives', outcome: 'Mostra alternative, modifica una lista e aggiungi un comportamento con una direttiva.', prerequisites: ['binding'], published: true },
  { id: 'components', category: 'basics', title: 'Comunicazione tra componenti', route: '/basics/components', outcome: 'Passa dati a un figlio e ricevi i suoi eventi senza confondere le responsabilità.', prerequisites: ['binding', 'control-flow'], published: true },
  { id: 'pipes', category: 'basics', title: 'Pipes', route: '/basics/pipes', outcome: 'Trasforma la presentazione dei dati con parametri e pipe riutilizzabili.', prerequisites: ['binding'], published: true },
  { id: 'course-exercise', category: 'basics', title: 'Esercitazione: catalogo corsi', route: '/basics/course-exercise', outcome: 'Crea in locale un catalogo corsi seguendo consegna, comandi e verifiche in cinque passi.', prerequisites: ['start', 'binding', 'control-flow', 'components', 'pipes'], published: true },
  { id: 'forms', category: 'basics', title: 'Reactive Forms', route: '/basics/forms', outcome: 'Osserva valori, validazione e stati di un form, invia e ripristina i dati.', prerequisites: ['binding', 'control-flow'], published: true },
  { id: 'services', category: 'basics', title: 'Servizi e dependency injection', route: '/basics/services', outcome: 'Estrai un comportamento condiviso e osserva lo scope di un servizio.', prerequisites: ['components'], published: true },
  { id: 'routing', category: 'basics', title: 'Routing', route: '/basics/routing', outcome: 'Naviga tra viste, leggi parametri e gestisci un percorso sconosciuto.', prerequisites: ['components', 'services'], published: true },
  { id: 'signals', category: 'advanced', title: 'Signals', route: '/advanced/signals', outcome: 'Distingui stato modificabile, valori derivati ed effetti verso API imperative.', prerequisites: ['components', 'control-flow'], published: true },
  { id: 'http', category: 'advanced', title: 'HTTP e servizi', route: '/advanced/http', outcome: 'Segui una richiesta dalla UI alla risposta e gestisci successo, attesa ed errore.', prerequisites: ['services', 'forms'], published: true },
];
export const GLOSSARY = [
  { term: 'Componente', definition: 'Una classe Angular con un template e uno stile: gestisce una parte dell’interfaccia.' },
  { term: 'Template', definition: 'HTML arricchito con espressioni Angular per mostrare dati e rispondere alle azioni.' },
  { term: 'Binding', definition: 'Un collegamento tra stato del componente e proprietà o eventi del template.' },
  { term: 'Observable', definition: 'Una sorgente di notifiche nel tempo. Per HTTP una sottoscrizione avvia la richiesta e riceve il risultato o un errore.' },
  { term: 'Dependency injection', definition: 'Angular fornisce a una classe le dipendenze di cui ha bisogno, come un servizio.' },
];
