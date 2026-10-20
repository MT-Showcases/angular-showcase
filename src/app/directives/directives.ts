// COMPONENT TYPE: Container
// ROLE: Teach one independent concept at a time with editable, commented source.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonExamples, LessonExample } from '../components/lesson-examples/lesson-examples';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { IF_EXAMPLE, FOR_EXAMPLE, SWITCH_EXAMPLE, DIRECTIVE_EXAMPLE } from './control-flow.example';
import { DIRECTIVE_DIAGRAM, FOR_DIAGRAM, IF_DIAGRAM, SWITCH_DIAGRAM } from './directives-diagrams';

@Component({
  selector: 'app-directives',
  imports: [LessonExamples, LessonDisclosure, LessonShell],
  templateUrl: './directives.html',
  styleUrl: './directives.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Directives {
  readonly examples: readonly LessonExample[] = [
    {
      id: "if",
      label: "@if",
      title: "@if: mostra o nascondi",
      prompt: "Premi il **pulsante**. Poi cambia il testo dei due rami nell’HTML.",
      takeaway: "`@if` crea un ramo o l’altro nel DOM in base a un **booleano**.",
      sources: IF_EXAMPLE,
      diagram: IF_DIAGRAM,
    },
    {
      id: "for",
      label: "@for",
      title: "@for: tre elementi con un ID",
      prompt: "Inverti l’ordine e osserva gli **ID**. Svuota la lista per vedere `@empty`.",
      takeaway: "L’ID resta legato al dato: `track` permette ad Angular di conservarne il nodo anche dopo un riordino.",
      sources: FOR_EXAMPLE,
      diagram: FOR_DIAGRAM,
    },
    {
      id: "switch",
      label: "@switch",
      title: "@switch: un caso alla volta",
      prompt: "Scegli uno **stato**, poi modifica il messaggio del caso corrispondente.",
      takeaway: "`@switch` mostra un solo caso; `@default` copre i valori non previsti.",
      sources: SWITCH_EXAMPLE,
      diagram: SWITCH_DIAGRAM,
    },
    {
      id: "directive",
      label: "Direttiva",
      title: "Una direttiva su un pulsante",
      prompt: "Clicca il pulsante o usa **Invio** e **Spazio**. Poi cambia il CSS della classe `highlighted`.",
      takeaway: "La **direttiva** aggiunge comportamento all’elemento esistente. Lo stato decide quando applicare la classe; il CSS decide l’aspetto.",
      sources: DIRECTIVE_EXAMPLE,
      diagram: DIRECTIVE_DIAGRAM,
    },
  ];
}
