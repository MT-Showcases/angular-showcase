// COMPONENT TYPE: Container
// ROLE: Teach values, validation and interaction states with compact editable examples.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { CONTACT_EXAMPLE, CONTROL_EXAMPLE } from './forms.example';
import { CONTACT_DIAGRAM, CONTROL_DIAGRAM } from './forms-diagrams';

@Component({
  selector: 'app-forms',
  imports: [LessonExamples, LessonDisclosure, LessonShell],
  templateUrl: './forms.html',
  styleUrl: './forms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Forms {
  readonly examples: readonly LessonExample[] = [
    {
      id: 'control',
      label: '1. FormControl',
      title: 'FormControl: valore, validità e interazione',
      prompt: 'Svuota il campo e poi esci: compare l’errore **required**. Mentre scrivi il controllo è **dirty**; con il blur diventa **touched**. Il pulsante chiama `reset()` e riporta il valore iniziale.',
      takeaway: '`value` è il dato corrente; `valid`, `dirty` e `touched` descrivono il controllo. Il blur segnala che hai lasciato il campo, non salva il valore.',
      sources: CONTROL_EXAMPLE,
      diagram: CONTROL_DIAGRAM,
    },
    {
      id: 'contact',
      label: '2. FormGroup',
      title: 'FormGroup: validazione, invio locale e reset',
      prompt: 'Compila nome, cognome ed email: gli errori compaiono dopo il blur, non appena apri la pagina. Attiva l’**organizzazione** facoltativa e confronta `value` con `getRawValue()`. Invia, poi modifica un campo.',
      takeaway: 'Il pulsante resta disabilitato finché il form è **non valido**. L’invio crea una copia locale normalizzata, indipendente dalle modifiche successive; nessun dato parte verso un server.',
      sources: CONTACT_EXAMPLE,
      diagram: CONTACT_DIAGRAM,
    },
  ];
}
