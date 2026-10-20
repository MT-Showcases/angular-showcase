// COMPONENT TYPE: Container
// ROLE: Teach one independent concept at a time with editable, commented source.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonExamples, LessonExample } from '../components/lesson-examples/lesson-examples';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { INPUT_EXAMPLE, OUTPUT_EXAMPLE, COMMUNICATION_EXAMPLE } from './communication.example';
import { COMBINED_DIAGRAM, INPUT_DIAGRAM, OUTPUT_DIAGRAM } from './communication-diagrams';

@Component({
  selector: 'app-component-communication',
  imports: [LessonExamples, LessonDisclosure, LessonShell],
  templateUrl: './component-communication.html',
  styleUrl: './component-communication.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentCommunication {
  readonly examples: readonly LessonExample[] = [
    {
      id: "input",
      label: "1. Input",
      title: "input(): un dato dal padre al figlio",
      prompt: "Scrivi un nome nel campo del padre. Il saluto del **figlio** riceve lo stesso valore.",
      takeaway: "Il padre passa il valore con `[name]`. Nel figlio `name()` legge l’input come un **signal**.",
      sources: INPUT_EXAMPLE,
      diagram: INPUT_DIAGRAM,
    },
    {
      id: "output",
      label: "2. Output",
      title: "output(): un evento dal figlio al padre",
      prompt: "Premi il pulsante del figlio. Poi cambia la stringa passata a `emit()` nel TypeScript.",
      takeaway: "Il figlio **emette** un messaggio. Il padre lo riceve come `$event` e decide come aggiornare il proprio stato.",
      sources: OUTPUT_EXAMPLE,
      diagram: OUTPUT_DIAGRAM,
    },
    {
      id: "combined",
      label: "3. Insieme",
      title: "Input e output, ciascuno nella sua direzione",
      prompt: "Incrementa il totale. Poi togli il gestore `(incremented)` dall’HTML e riprova.",
      takeaway: "Il dato entra nel figlio; la richiesta esce. Senza un **gestore** nel padre, il contatore non cambia.",
      sources: COMMUNICATION_EXAMPLE,
      diagram: COMBINED_DIAGRAM,
    },
  ];
}
