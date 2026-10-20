import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

// Static schemas: they describe the seed, not the current editor content.
const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Se modifichi template o stato, il comportamento dell’esempio cambia.';

/** Parent state, the real [name] binding and the child input read. */
export const INPUT_DIAGRAM: LessonDiagramData = {
  title: 'Il nome scende dal padre al figlio',
  description: 'Il padre possiede `name` e lo passa con `[name]` nel proprio template. Il figlio riceve l’input e lo legge con `name()`: il valore viaggia **solo dal padre al figlio**.',
  groups: [
    {
      title: 'Dato in ingresso',
      steps: [
        {
          nodes: [
            { id: 'input-parent', label: 'Padre: stato', file: 'component.ts', detail: '`name = \'Ada\'`' },
          ],
          connection: { direction: 'down', label: 'passa il valore' },
        },
        {
          nodes: [
            { id: 'input-binding', label: 'Padre: binding nel template', file: 'component.html', detail: '`[name]="name"`' },
          ],
          connection: { direction: 'down', label: 'il figlio lo riceve' },
        },
        {
          nodes: [
            { id: 'input-child', label: 'Figlio: input', file: 'greeting.component.ts', detail: '`name()` legge il signal' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Child emission, the (sent) listener and the parent state that consumes $event. */
export const OUTPUT_DIAGRAM: LessonDiagramData = {
  title: 'Il messaggio sale dal figlio al padre',
  description: 'Il figlio chiama `sent.emit(\'Ciao dal figlio!\')`; il padre ascolta `(sent)` e riceve il valore in `$event`. L’evento viaggia **solo dal figlio al padre**.',
  groups: [
    {
      title: 'Evento in uscita: figlio → padre',
      steps: [
        {
          nodes: [
            { id: 'output-parent', label: 'Padre: stato', file: 'component.ts', detail: '`message` conserva il testo' },
          ],
          connection: { direction: 'up', label: 'il padre aggiorna lo stato' },
        },
        {
          nodes: [
            { id: 'output-binding', label: 'Padre: binding nel template', file: 'component.html', detail: '`(sent)="message = $event"`' },
          ],
          connection: { direction: 'up', label: 'riceve il messaggio in $event' },
        },
        {
          nodes: [
            { id: 'output-child', label: 'Figlio: pulsante', file: 'message-button.component.ts', detail: "`sent.emit('Ciao dal figlio!')`" },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** Both directions kept apart: the label enters, the increment request exits. */
export const COMBINED_DIAGRAM: LessonDiagramData = {
  title: 'Due direzioni, due responsabilità',
  description: 'Il padre passa il testo **Aggiungi 1** con `[label]` e possiede `count`. Il figlio chiede un incremento con `incremented.emit()`; il padre ascolta `(incremented)` e aggiorna il proprio `count`. Il figlio non conosce il totale: le due direzioni restano **indipendenti**.',
  groups: [
    {
      title: 'Ingresso: padre → figlio',
      steps: [
        {
          nodes: [
            { id: 'combined-label-binding', label: 'Padre: binding nel template', file: 'component.html', detail: '`[label]="\'Aggiungi 1\'"`' },
          ],
          connection: { direction: 'down', label: 'il figlio legge label()' },
        },
        {
          nodes: [
            { id: 'combined-child-label', label: 'Figlio: testo del pulsante', file: 'counter-button.component.ts', detail: '`label()` è solo un testo' },
          ],
        },
      ],
    },
    {
      title: 'Uscita: figlio → padre',
      steps: [
        {
          nodes: [
            { id: 'combined-parent-total', label: 'Padre: contatore', file: 'component.ts', detail: '`count` appartiene al padre' },
          ],
          connection: { direction: 'up', label: 'il padre aggiorna il totale' },
        },
        {
          nodes: [
            { id: 'combined-event-binding', label: 'Padre: gestore', file: 'component.html', detail: '`(incremented)="count = count + 1"`' },
          ],
          connection: { direction: 'up', label: 'evento senza un valore numerico' },
        },
        {
          nodes: [
            { id: 'combined-child-event', label: 'Figlio: clic', file: 'counter-button.component.ts', detail: '`incremented.emit()`' },
          ],
        },
      ],
    },
  ],
  note: 'Schema della configurazione iniziale. `label` non contiene il totale; l’evento `incremented` è `void` e non trasporta numeri: il padre incrementa `count` da solo.',
};
