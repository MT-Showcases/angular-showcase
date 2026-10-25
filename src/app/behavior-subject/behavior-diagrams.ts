import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi il codice, il comportamento dell’esempio può cambiare.';

/** A late consumer sees the Subject's future values and the BehaviorSubject's current value. */
export const COMPARE_DIAGRAM: LessonDiagramData = {
  title: 'Valore corrente e consumatore tardivo',
  description: '`send()` chiama `next` sulle due sorgenti. Il `Subject` notifica solo i sottoscrittori presenti; il `BehaviorSubject` consegna subito il valore corrente al figlio B appena montato. `AsyncPipe` gestisce la sottoscrizione e la pulizia.',
  groups: [
    {
      title: 'Dall’azione ai valori',
      steps: [
        {
          nodes: [
            { id: 'compare-send', label: 'Invia', file: 'component.html', detail: '`(click)` chiama `send()`' },
          ],
          connection: { direction: 'down', label: 'next con lo stesso testo' },
        },
        {
          nodes: [
            { id: 'compare-sources', label: 'Subject e BehaviorSubject', file: 'component.ts', detail: 'privati, esposti con `asObservable()`' },
          ],
          connection: { direction: 'down', label: 'notifica i sottoscrittori' },
        },
        {
          nodes: [
            { id: 'compare-observer', label: 'Consumatore A o B', file: 'observer.component.ts', detail: '`input.required` riceve l’Observable' },
          ],
          connection: { direction: 'down', label: 'AsyncPipe aggiorna la vista' },
        },
        {
          nodes: [
            { id: 'compare-view', label: 'Testo o nessuna emissione', file: 'observer.component.ts', detail: 'la stringa vuota resta un valore distinto' },
          ],
        },
      ],
    },
    {
      title: 'Collegamento tardivo',
      steps: [
        {
          nodes: [
            { id: 'compare-toggle', label: 'Mostra vista tardiva', file: 'component.html', detail: '`(click)` cambia il signal `lateVisible`' },
          ],
          connection: { direction: 'down', label: '@if monta o smonta B' },
        },
        {
          nodes: [
            { id: 'compare-pipe', label: 'Nuova sottoscrizione', file: 'observer.component.ts', detail: 'BehaviorSubject emette subito, Subject no' },
          ],
          connection: { direction: 'down', label: 'il pannello mostra il risultato' },
        },
        {
          nodes: [
            { id: 'compare-panels', label: 'Pannelli per ruolo', file: 'component.css', detail: 'primary e secondary container' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** One immutable state object feeds the count, the derived double and the bounded history. */
export const COUNTER_DIAGRAM: LessonDiagramData = {
  title: 'Uno stato, tre letture',
  description: '`increment` e `decrement` leggono un’istantanea con `.value`, costruiscono un nuovo oggetto e chiamano `next`. `state$` alimenta conteggio e cronologia; `double$` deriva il doppio con `map`.',
  groups: [
    {
      title: 'Dall’azione allo stato',
      steps: [
        {
          nodes: [
            { id: 'counter-actions', label: 'Incrementa, Decrementa o Reset', file: 'component.html', detail: '`(click)` chiama i metodi della classe' },
          ],
          connection: { direction: 'down', label: 'calcola il prossimo conteggio' },
        },
        {
          nodes: [
            { id: 'counter-snapshot', label: '.value sincrono', file: 'component.ts', detail: 'istantanea utile a costruire il nuovo stato' },
          ],
          connection: { direction: 'down', label: 'crea un nuovo oggetto' },
        },
        {
          nodes: [
            { id: 'counter-next', label: 'next stato immutabile', file: 'component.ts', detail: 'nuovo array con `slice(-5)`' },
          ],
          connection: { direction: 'down', label: 'stato e derivati si aggiornano' },
        },
      ],
    },
    {
      title: 'Letture nella vista',
      steps: [
        {
          nodes: [
            { id: 'counter-state', label: 'state$ con AsyncPipe', file: 'component.html', detail: 'conteggio e ultimi cinque cambi' },
          ],
          connection: { direction: 'down', label: 'map trasforma il conteggio' },
        },
        {
          nodes: [
            { id: 'counter-double', label: 'double$', file: 'component.ts', detail: 'valore derivato, non un campo specchio' },
          ],
          connection: { direction: 'down', label: 'mostra il doppio' },
        },
        {
          nodes: [
            { id: 'counter-view', label: 'Carte e cronologia', file: 'component.css', detail: 'container/on-container per ogni lettura' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** A root service holds the shared object; both panels read the same observable. */
export const PROFILE_DIAGRAM: LessonDiagramData = {
  title: 'Una sola istanza, due consumatori',
  description: 'Il padre e i due pannelli iniettano lo stesso `UserStateService` root. Il servizio conserva uno stato privato, espone `user$` e sostituisce l’oggetto a ogni `update` o `reset`; `AsyncPipe` mostra il valore in entrambi i pannelli.',
  groups: [
    {
      title: 'Servizio condiviso',
      steps: [
        {
          nodes: [
            { id: 'profile-editor', label: 'Nome e azioni', file: 'component.html', detail: 'bozza locale, invio esplicito' },
          ],
          connection: { direction: 'down', label: 'chiama update o reset' },
        },
        {
          nodes: [
            { id: 'profile-parent', label: 'Padre inject', file: 'component.ts', detail: 'stessa istanza dei figli' },
          ],
          connection: { direction: 'down', label: 'il servizio possiede lo stato' },
        },
        {
          nodes: [
            { id: 'profile-service', label: 'BehaviorSubject privato', file: 'user-state.service.ts', detail: '`user$` pubblico, trim e reset ospite' },
          ],
          connection: { direction: 'down', label: 'nuovo oggetto per ogni cambio' },
        },
      ],
    },
    {
      title: 'Consumatori',
      steps: [
        {
          nodes: [
            { id: 'profile-panel-a', label: 'Consumatore A', file: 'user-panel.component.ts', detail: 'inject dello stesso servizio' },
            { id: 'profile-panel-b', label: 'Consumatore B', file: 'user-panel.component.ts', detail: 'inject dello stesso servizio' },
          ],
          connection: { direction: 'down', label: 'AsyncPipe si sottoscrive a user$' },
        },
        {
          nodes: [
            { id: 'profile-view', label: 'Nome e stato online', file: 'component.html', detail: 'entrambi i pannelli riflettono il cambio' },
          ],
          connection: { direction: 'down', label: 'il colore distingue i ruoli' },
        },
        {
          nodes: [
            { id: 'profile-css', label: 'Contenitori colorati', file: 'component.css', detail: 'primary e secondary container' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
