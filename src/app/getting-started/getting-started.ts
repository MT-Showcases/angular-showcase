// COMPONENT TYPE: Container
// ROLE: Introduce components through editable, executable source with optional context.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { FIRST_COMPONENT } from './first-component.example';

@Component({
  selector: 'app-getting-started',
  imports: [AngularPlayground, LessonDisclosure, LessonShell],
  templateUrl: './getting-started.html',
  styleUrl: './getting-started.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GettingStarted {
  readonly example = FIRST_COMPONENT;
}
