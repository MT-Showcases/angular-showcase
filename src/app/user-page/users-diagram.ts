import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

/** Source-linked overview of the initial project, after the full editor. */
export const USERS_DIAGRAM: LessonDiagramData = {
  title: 'Dal server alla card, dalla card al padre',
  description: 'La **GET** attraversa il servizio; il padre conserva i dati e deriva il filtro. Ogni card riceve un utente e invia al padre solo l’ID da rimuovere localmente.',
  groups: [
    {
      title: 'Caricamento e vista',
      steps: [
        {
          nodes: [{ id: 'config', label: 'Configurazione HTTP', file: 'app.config.ts', detail: '`provideHttpClient()`' }],
          connection: { direction: 'down', label: 'rende disponibile HttpClient' },
        },
        {
          nodes: [{ id: 'request', label: 'Carica utenti', file: 'component.html', detail: '`(click)="load()"`' }],
          connection: { direction: 'down', label: 'il padre si sottoscrive a getUsers()' },
        },
        {
          nodes: [{ id: 'service', label: 'Servizio e API', file: 'users.service.ts', detail: '`HttpClient.get<User[]>()` verso `/users`' }],
          connection: { direction: 'down', label: 'risposta o errore aggiornano i signal del padre' },
        },
        {
          nodes: [{ id: 'state', label: 'Stato e filtro', file: 'component.ts', detail: '`serverUsers` → `visibleUsers` → `filteredUsers`' }],
          connection: { direction: 'down', label: 'il template passa [user] alla card' },
        },
        {
          nodes: [{ id: 'child', label: 'Componente figlio', file: 'user-card.ts', detail: '`input.required<User>()` legge l’utente' }],
        },
      ],
    },
    {
      title: 'Rimozione locale e presentazione',
      steps: [
        {
          nodes: [{ id: 'output', label: 'Evento della card', file: 'user-card.ts', detail: '`remove.emit(id)` risale al padre' }],
          connection: { direction: 'up', label: '(remove)="removeUser($event)": nessuna DELETE' },
        },
        {
          nodes: [{ id: 'local', label: 'ID nascosti in memoria', file: 'component.ts', detail: '`removedIds` cambia la vista; una GET riuscita ripristina gli utenti' }],
        },
        {
          nodes: [{ id: 'styles', label: 'Layout e colori', file: 'component.css', detail: 'Griglia responsiva e token Material' }],
        },
      ],
    },
  ],
  note: 'Schema della configurazione iniziale. Modificare il codice può cambiare il comportamento della demo.',
};
