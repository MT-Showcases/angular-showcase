import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

/** Data flowing to the view and events flowing back stay in separate groups. */
export const BINDING_DIAGRAM: LessonDiagramData = {
  title: 'Due direzioni, distinti collegamenti',
  description: '`[value]` e `[disabled]` portano il dato verso la vista. `(input)` chiama `onNameInput`, che assegna `name`; `[(ngModel)]` collega invece **entrambe le direzioni**.',
  groups: [
    {
      title: 'Dato: classe → vista',
      steps: [
        {
          nodes: [
            { id: 'binding-state', label: 'Stato nel componente', file: 'component.ts', detail: '`name = \'Ada\'`, `isLocked = false`' },
          ],
          connection: { direction: 'down', label: 'binding unidirezionale' },
        },
        {
          nodes: [
            { id: 'binding-prop', label: 'Proprietà nel template', file: 'component.html', detail: '`[value]="name"` e `[disabled]="isLocked"`' },
          ],
        },
      ],
    },
    {
      title: 'Evento: vista → classe',
      steps: [
        {
          nodes: [
            { id: 'binding-method', label: 'Stato aggiornato', file: 'component.ts', detail: '`onNameInput` assegna `name`' },
          ],
          connection: { direction: 'up', label: 'il gestore cambia lo stato' },
        },
        {
          nodes: [
            { id: 'binding-event', label: 'Evento nella vista', file: 'component.html', detail: '`(input)="onNameInput($event)"`' },
          ],
        },
      ],
    },
  ],
  note: 'Schema della configurazione iniziale. `[value]` non aggiorna la classe da solo: serve il gestore dell’evento. `[(ngModel)]` riunisce le due direzioni nello stesso binding.',
};
