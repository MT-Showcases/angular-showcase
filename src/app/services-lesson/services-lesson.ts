// COMPONENT TYPE: Learning container
// SECTION: Angular Basics — Services and dependency injection
// ROLE: Connect two editable seeds that show one shared provider and a nearer local provider.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { SCOPED_SERVICE_EXAMPLE, SHARED_SERVICE_EXAMPLE } from './services.example';

@Component({
  selector: 'app-services-lesson',
  imports: [LessonDisclosure, LessonExamples, LessonShell, RouterLink],
  templateUrl: './services-lesson.html',
  styleUrl: './services-lesson.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesLesson {
  readonly examples: readonly LessonExample[] = [
    {
      id: 'shared',
      label: '1. Servizio condiviso',
      title: 'Un provider sul padre, due viste sullo stesso oggetto',
      prompt: 'Aumenta **Condivisa A**: cambia anche B. Azzera da B: entrambe tornano a zero. Le due viste usano lo stesso oggetto perché il provider `CounterService` è sul padre.',
      takeaway: '`inject(CounterService)` chiede il servizio al **provider più vicino**. Lo stesso provider restituisce lo stesso oggetto: non crea un\'istanza per ogni chiamata.',
      sources: SHARED_SERVICE_EXAMPLE,
    },
    {
      id: 'scoped',
      label: '2. Provider locale',
      title: 'Un provider più vicino apre uno scope separato',
      prompt: 'Aumenta **Isolata A**: il contatore condiviso resta fermo. Azzera Isolata A e osserva B. Poi **rimuovi** e ricrea la coppia: il condiviso conserva il valore, gli isolati ripartono da zero.',
      takeaway: 'Lo stesso `CounterService` ha qui un provider locale su ogni `IsolatedCounter`. Il provider più vicino vince e apre uno **scope** separato: la classe è la stessa, gli oggetti no.',
      sources: SCOPED_SERVICE_EXAMPLE,
    },
  ];
}
