import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

/** State, template binding and appearance kept in their own responsibilities. */
export const FIRST_COMPONENT_DIAGRAM: LessonDiagramData = {
  title: 'Una classe, un template, uno stile',
  description: '`component.ts` possiede lo stato e il comportamento. Il template legge quello stato e decide quale classe applicare; il CSS descrive **solo l’aspetto**.',
  groups: [
    {
      title: 'Responsabilità dei tre file',
      steps: [
        {
          nodes: [
            { id: 'first-state', label: 'Stato del componente', file: 'component.ts', detail: '`message`, `count`, `highlighted`' },
          ],
          connection: { direction: 'down', label: 'il template legge lo stato' },
        },
        {
          nodes: [
            { id: 'first-template', label: 'Vista e binding', file: 'component.html', detail: '`{{ count }}` e `[class.card--highlighted]="highlighted"`' },
          ],
          connection: { direction: 'down', label: 'il CSS seleziona la classe applicata' },
        },
        {
          nodes: [
            { id: 'first-style', label: 'Solo aspetto', file: 'component.css', detail: '`.card--highlighted` cambia colori e bordo' },
          ],
        },
      ],
    },
  ],
  note: 'Schema della configurazione iniziale. Il CSS non possiede `highlighted`: il template applica la classe, il foglio di stile la rende visibile. Se modifichi il codice, il comportamento cambia.',
};
