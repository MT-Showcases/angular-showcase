// COMPONENT TYPE: Container
// ROLE: Teach one pipe concept at a time with editable, commented source.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { CURRENCY_EXAMPLE, DATE_EXAMPLE, TAG_LIST_EXAMPLE, UPPERCASE_EXAMPLE } from './pipes.example';
import { CURRENCY_DIAGRAM, DATE_DIAGRAM, TAG_LIST_DIAGRAM, UPPERCASE_DIAGRAM } from './pipes-diagrams';
import { TagListPipe } from './tag-list-pipe';

@Component({
  selector: 'app-pipes-lesson',
  imports: [LessonExamples, LessonDisclosure, LessonShell, RouterLink, TagListPipe],
  templateUrl: './pipes.html',
  styleUrl: './pipes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipesLesson {
  // Reuse the custom pipe for the short lesson index.
  readonly exampleTopics: readonly string[] = ['formato data', 'valuta', 'maiuscole', 'pipe personalizzata'];

  readonly examples: readonly LessonExample[] = [
    {
      id: 'date',
      label: '1. Date',
      title: 'DatePipe: formato e fuso orario',
      prompt: 'Cambia il **formato** e lo **scarto orario**: il timestamp ISO resta lo stesso. La locale è `en-US`; i dati italiani non sono caricati.',
      takeaway: '`date` trasforma solo la **presentazione**. Un fuso come `+0200` è uno scarto fisso, non un calendario con ora legale.',
      sources: DATE_EXAMPLE,
      diagram: DATE_DIAGRAM,
    },
    {
      id: 'currency',
      label: '2. Currency',
      title: 'CurrencyPipe: importo e valuta',
      prompt: 'Modifica **importo**, valuta e visualizzazione. Svuota il campo per vedere il caso senza numero.',
      takeaway: '`currency` formatta il numero con la locale `en-US`. Cambiare valuta cambia l’**etichetta**, non converte il denaro.',
      sources: CURRENCY_EXAMPLE,
      diagram: CURRENCY_DIAGRAM,
    },
    {
      id: 'uppercase',
      label: '3. Maiuscole',
      title: 'UpperCasePipe: cambia solo la vista',
      prompt: 'Scrivi nel campo. Il risultato è in **maiuscolo**, mentre il testo originale conserva la sua grafia.',
      takeaway: '`uppercase` restituisce una nuova stringa per la vista. Lo **stato** del componente non viene modificato.',
      sources: UPPERCASE_EXAMPLE,
      diagram: UPPERCASE_DIAGRAM,
    },
    {
      id: 'tagList',
      label: '4. Pipe custom',
      title: 'TagListPipe: una pipe pura con parametro',
      prompt: 'Aggiungi un’**etichetta** e cambia il separatore. Prova anche un valore vuoto: il pulsante resta disabilitato.',
      takeaway: 'La pipe pura riceve un **nuovo array** creato con lo spread. Angular la ricalcola quando cambia il riferimento o il parametro del separatore.',
      sources: TAG_LIST_EXAMPLE,
      diagram: TAG_LIST_DIAGRAM,
    },
  ];
}
